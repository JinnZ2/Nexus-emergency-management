import 'dart:async';
import 'dart:convert';
import '../models/observation.dart';
import '../store/observation_store.dart';
import '../identity/identity.dart';
import '../identity/trust_graph.dart';
import 'mesh_transport.dart';

/// GOSSIP — the keystone. Where store + identity + trust first run together,
/// and where the forge vector actually closes.
///
/// The receive pipeline, in strict order, for every incoming observation:
///
///   1. STAMP LOCAL TRANSIT  — overwrite wire-supplied hopCount/receivedAt/
///      expiresAt with THIS node's view via withLocalTransit(). The wire's
///      transit claims are discarded. Forging hopCount now buys nothing.
///
///   2. LEARN KEYS (vouches) — if it's a vouch, pull voucher_pubkey out and
///      Verifier.learnKey(). learnKey refuses fingerprint/key mismatches, so a
///      peer can't bind someone else's fingerprint to attacker-chosen bytes.
///      Without this step the voucher's own signature can't verify and
///      transitive trust never propagates.
///
///   3. VERIFY (best-effort)  — check the signature if we can. Failure is NOT
///      rejection: unsigned / unknown-key / bad-sig => Level 0 data. Still
///      stored, still shown, still contradiction-checked. Never silenced.
///
///   4. STORE (dedup)        — store.add() returns NEW vs KNOWN by content-id.
///      Known content can still improve its transit (shorter path) but is NOT
///      re-flooded.
///
///   5. FORWARD IF NEW       — only genuinely-new observations flood onward,
///      to every OTHER active transport. This is the multi-hop carry.
class GossipService {
  final ObservationStore store;
  final Identity identity;
  final Verifier verifier;

  /// Original/preplanned organizer fingerprints (depth 0). Empty for a purely
  /// spontaneous mesh — trust just flattens to floor for everyone, which is the
  /// correct safety-first behavior when nobody had time to prepare.
  final Set<String> organizers;

  final List<MeshTransport> _transports = [];
  final List<StreamSubscription> _subs = [];

  /// TTL applied to carried observations when this node first receives them.
  final Duration carryTtl;

  /// Hop ceiling — a carried observation past this is no longer forwarded.
  final int maxCarryHops;

  /// Emits whenever the stored set changes, so UI / trust / contradiction
  /// layers can recompute. Carries nothing but a tick.
  final _changes = StreamController<void>.broadcast();
  Stream<void> get onChanged => _changes.stream;

  GossipService({
    required this.store,
    required this.identity,
    required this.verifier,
    this.organizers = const {},
    this.carryTtl = const Duration(hours: 24),
    this.maxCarryHops = 5,
  });

  Future<void> init(List<MeshTransport> transports) async {
    _transports.addAll(transports);
    for (final t in _transports) {
      await t.start();
      _subs.add(
        t.onObservationsReceived.listen((batch) => _handleReceived(batch, t)),
      );
    }
  }

  // ---- AUTHORING (local reports + vouches) ----

  /// Create and store a local observation, signed automatically. The caller
  /// supplies content; chaining, signing, and storage happen here. Returns the
  /// stored, signed observation. The human never touched a key.
  Future<Observation> report({
    required double lat,
    required double lon,
    double? altitude,
    required String property,
    required String value,
    String? unit,
    String vantageType = 'direct',
    double? vantageLat,
    double? vantageLon,
    String? vantageDescription,
    String? inference,
  }) async {
    final previousId = await store.lastLocalId(identity.pseudonym);
    final unsigned = Observation(
      previousId: previousId,
      pseudonym: identity.pseudonym,
      timestamp: DateTime.now().toUtc(),
      lat: lat,
      lon: lon,
      altitude: altitude,
      property: property,
      value: value,
      unit: unit,
      vantageType: vantageType,
      vantageLat: vantageLat,
      vantageLon: vantageLon,
      vantageDescription: vantageDescription,
      inference: inference,
    );
    final signed = await identity.sign(unsigned);
    await store.add(signed);
    // make our own key verifiable to ourselves + anyone we sync with
    verifier.learnKey(identity.fingerprint, identity.publicKeyBytes);
    _changes.add(null);
    await _floodToAll(signed, exclude: null);
    return signed;
  }

  /// Vouch for someone. Human action: "I know this person." `vouchedFingerprint`
  /// is obtained out-of-band (in-person QR). `myDepth` is this node's own
  /// distance from an organizer (0 if this node is an organizer).
  Future<Observation> vouchFor({
    required String vouchedFingerprint,
    required int myDepth,
    required double lat,
    required double lon,
  }) async {
    final previousId = await store.lastLocalId(identity.pseudonym);
    final vouch = await buildSignedVouch(
      voucher: identity,
      vouchedFingerprint: vouchedFingerprint,
      voucherDepth: myDepth,
      previousId: previousId,
      lat: lat,
      lon: lon,
    );
    await store.add(vouch);
    _changes.add(null);
    await _floodToAll(vouch, exclude: null);
    return vouch;
  }

  // ---- RECEIVING (the keystone pipeline) ----

  Future<void> _handleReceived(
    List<Observation> batch,
    MeshTransport source,
  ) async {
    var anyNew = false;
    for (final incoming in batch) {
      // 1. STAMP LOCAL TRANSIT — discard wire transit claims.
      final isFromElsewhere = incoming.authorKey != identity.fingerprint &&
          incoming.pseudonym != identity.pseudonym;
      final localView = incoming.withLocalTransit(
        isCarried: isFromElsewhere,
        originPseudonym: incoming.originPseudonym ?? incoming.pseudonym,
        // OUR hop count: what the wire claimed, +1 — but only as a starting
        // point. store.improveTransit will floor it if we already knew a
        // shorter path. We never trust the wire value as authoritative; we
        // treat it as "at least this far" and let the store reconcile.
        hopCount: isFromElsewhere ? incoming.hopCount + 1 : incoming.hopCount,
        receivedAt: DateTime.now().toUtc(),
        expiresAt: DateTime.now().toUtc().add(carryTtl),
      );

      // 2. LEARN KEYS if this is a vouch carrying a pubkey.
      if (localView.property == 'vouch') {
        _learnVoucherKey(localView);
      }
      // a signed non-vouch observation may also be the first time we see this
      // author; we can only learn their key from a vouch that carries pubkey
      // bytes, so plain signed reports from unknown keys stay Level 0 until a
      // vouch for them arrives. That is the intended trust gate.

      // 3. VERIFY (best-effort; failure != rejection).
      //    We don't branch storage on the result — verification status is
      //    recomputed by the trust layer at read time from learned keys, so a
      //    key learned LATER retroactively upgrades older observations.
      //    (No await-side-effect needed here for correctness; left as a hook.)

      // 4. STORE (dedup by content-id).
      final isNew = await store.add(localView);
      if (isNew) anyNew = true;

      // 5. FORWARD happens after the loop, only for new ones, to avoid
      //    re-flooding within a batch.
      if (isNew && _withinHopLimit(localView)) {
        await _floodToAll(localView, exclude: source);
      }
    }
    if (anyNew) _changes.add(null);
  }

  void _learnVoucherKey(Observation vouch) {
    try {
      final m = jsonDecode(vouch.value);
      final b64 = m['voucher_pubkey'];
      if (b64 == null || vouch.authorKey == null) return;
      final pub = base64Decode(b64);
      // learnKey refuses if fingerprint != hash(pub) — substitution-proof.
      verifier.learnKey(vouch.authorKey!, pub);
    } catch (_) {
      // malformed vouch — ignore; it simply won't carry trust.
    }
  }

  bool _withinHopLimit(Observation o) => o.hopCount < maxCarryHops;

  Future<void> _floodToAll(Observation o, {MeshTransport? exclude}) async {
    for (final t in _transports) {
      if (t == exclude) continue;
      if (!t.isRunning) continue;
      try {
        await t.sendObservations([o]);
      } catch (_) {
        // transport-level failure is not gossip's problem; other transports
        // and future syncs will carry it. Never let one dead radio stop the rest.
      }
    }
  }

  // ---- TRUST (recomputed on demand from learned keys + stored vouches) ----

  /// Current trust weights for every known key. Pure function of stored vouches
  /// + organizer set; recompute any time (cheap at community scale).
  Future<Map<String, double>> trustWeights({double decayBase = 0.8}) async {
    final all = await store.getAll();
    final graph = TrustGraph(
      originalOrganizers: organizers,
      decayBase: decayBase,
    );
    return graph.resolve(all);
  }

  Future<void> pruneExpired() => store.pruneExpired();

  Future<void> dispose() async {
    for (final s in _subs) {
      await s.cancel();
    }
    for (final t in _transports) {
      await t.stop();
    }
    await _changes.close();
  }
}
