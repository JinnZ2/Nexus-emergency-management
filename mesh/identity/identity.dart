import 'dart:convert';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';
import 'package:crypto/crypto.dart' show sha256;
import '../models/observation.dart';

/// IDENTITY LAYER — the keypair the human never sees.
///
/// Design law (unchanged from TRUST_AND_SECURITY.md):
///   The system NEVER asks a human to understand cryptography.
///   Public surface of this file is exactly:
///     - Identity.create(name)        -> "pick a name, you're in"
///     - identity.sign(observation)   -> happens automatically on every report
///     - Verifier.verify(observation) -> happens automatically on receipt
///     - buildSignedVouch(...)        -> "I know this person"
///   Words like "key", "sign", "Ed25519" appear in code, NEVER in any UI string.
///
/// Algorithm: Ed25519. Chosen because keygen/sign/verify are fast on a phone,
/// keys are tiny (32 bytes), and it has no parameter footguns. The keypair is
/// generated silently at first launch and persisted by the caller (the store /
/// secure-prefs layer); this file only creates and uses it.

/// A node's identity. Created once at first launch, then loaded each run.
class Identity {
  final SimplePublicKey _publicKey;
  final SimpleKeyPair _keyPair; // private material; never serialized to the mesh
  final String pseudonym; // human-chosen display name ("House on 5th")

  /// Stable short fingerprint of the public key. This is what appears on the
  /// wire as `author_key` and what TrustGraph reasons about. It is an opaque
  /// token to the human — never labeled, never shown unless a dev surface asks.
  final String fingerprint;

  Identity._(this._keyPair, this._publicKey, this.pseudonym, this.fingerprint);

  static final _ed25519 = Ed25519();

  /// FIRST LAUNCH. Human action behind this: typed or accepted a name.
  /// Everything cryptographic happens here, invisibly.
  static Future<Identity> create(String pseudonym) async {
    final kp = await _ed25519.newKeyPair();
    final pub = await kp.extractPublicKey();
    final fp = _fingerprintOf(pub.bytes);
    return Identity._(kp, pub, pseudonym, fp);
  }

  /// LOAD on subsequent launches from persisted seed bytes (32-byte private
  /// seed). The caller stores the seed in platform secure storage; we never
  /// put it on the mesh.
  static Future<Identity> load({
    required List<int> privateSeed,
    required String pseudonym,
  }) async {
    final kp = await _ed25519.newKeyPairFromSeed(privateSeed);
    final pub = await kp.extractPublicKey();
    final fp = _fingerprintOf(pub.bytes);
    return Identity._(kp, pub, pseudonym, fp);
  }

  /// Export the 32-byte private seed for the caller to persist securely.
  /// This is the ONLY path private material leaves this object, and it goes to
  /// local secure storage, never to a transport.
  Future<List<int>> exportSeed() async => await _keyPair.extractPrivateKeyBytes();

  /// Raw public key bytes — published with vouches/observations so peers can
  /// verify. Public by definition; safe to share.
  List<int> get publicKeyBytes => _publicKey.bytes;

  /// Sign an observation. Returns the same observation with `signature` and
  /// `authorKey` populated. Called automatically by the app on every report —
  /// the human does nothing.
  ///
  /// We sign `signingPayload` = "id|previousId" so BOTH the content and its
  /// position in the author's chain are tamper-evident, without the signature
  /// or key ever entering the content id.
  Future<Observation> sign(Observation obs) async {
    final payload = utf8.encode(obs.signingPayload);
    final sig = await _ed25519.sign(payload, keyPair: _keyPair);
    return _withAuthorship(
      obs,
      authorKey: fingerprint,
      signature: base64Encode(sig.bytes),
    );
  }

  static String _fingerprintOf(List<int> pubBytes) {
    // Short, stable, collision-resistant handle for the public key.
    final h = sha256.convert(pubBytes).toString();
    return h.substring(0, 16); // 64 bits of fingerprint is plenty for this scale
  }

  // Rebuild observation with authorship fields. Content/id unchanged.
  static Observation _withAuthorship(
    Observation o, {
    required String authorKey,
    required String signature,
  }) {
    return Observation(
      previousId: o.previousId,
      pseudonym: o.pseudonym,
      timestamp: o.timestamp,
      lat: o.lat,
      lon: o.lon,
      altitude: o.altitude,
      property: o.property,
      value: o.value,
      unit: o.unit,
      vantageType: o.vantageType,
      vantageLat: o.vantageLat,
      vantageLon: o.vantageLon,
      vantageDescription: o.vantageDescription,
      inference: o.inference,
      authorKey: authorKey,
      signature: signature,
      isCarried: o.isCarried,
      originPseudonym: o.originPseudonym,
      hopCount: o.hopCount,
      receivedAt: o.receivedAt,
      expiresAt: o.expiresAt,
    );
  }
}

/// Verifies signatures on incoming observations. Stateless; needs the author's
/// public key bytes, which travel with vouches (and can be cached).
///
/// This is what turns TrustGraph's `signed` flag from "claims to be signed"
/// into "cryptographically is signed by the holder of this key."
class Verifier {
  static final _ed25519 = Ed25519();

  /// A directory of fingerprint -> public key bytes, learned from vouches and
  /// signed observations as they arrive. Caller populates it; we read it.
  final Map<String, List<int>> _knownKeys;

  Verifier(this._knownKeys);

  /// Learn a public key (e.g. when a vouch carries the vouched party's key,
  /// or a node first publishes its own). Verifies the fingerprint matches the
  /// bytes before trusting the association — stops a peer from claiming someone
  /// else's fingerprint maps to attacker-chosen key bytes.
  bool learnKey(String claimedFingerprint, List<int> pubBytes) {
    final actual = Identity._fingerprintOf(pubBytes);
    if (actual != claimedFingerprint) return false; // fingerprint/key mismatch
    _knownKeys[claimedFingerprint] = pubBytes;
    return true;
  }

  /// Verify an observation's signature against the author's known public key.
  ///
  /// Returns:
  ///   true  -> signature valid; this observation provably came from the holder
  ///            of author_key. TrustGraph may weight it.
  ///   false -> no signature, unknown key, or bad signature. The observation is
  ///            STILL VALID DATA (Level 0) — it just can't be cryptographically
  ///            attributed, so it gets floor trust, never silence.
  Future<bool> verify(Observation obs) async {
    if (!obs.isSigned) return false; // keyless / unsigned -> Level 0, not rejected
    final pubBytes = _knownKeys[obs.authorKey];
    if (pubBytes == null) return false; // key not learned yet -> Level 0 for now
    try {
      final sigBytes = base64Decode(obs.signature!);
      final ok = await _ed25519.verify(
        utf8.encode(obs.signingPayload),
        signature: Signature(
          sigBytes,
          publicKey: SimplePublicKey(pubBytes, type: KeyPairType.ed25519),
        ),
      );
      return ok;
    } catch (_) {
      return false;
    }
  }
}

/// Build a SIGNED vouch. Human action behind this: tapped "I know this person."
///
/// Carries the voucher's public key bytes inline so a receiver who doesn't yet
/// know the voucher can learn + verify in one step. The vouched party's key is
/// referenced by fingerprint in the value (set by trust_graph.buildVouch).
///
/// voucherDepth: the voucher's own distance from an original organizer (0 if
/// original). The resulting vouch certifies the vouched party at depth+1, and
/// trust_graph applies the decay.
Future<Observation> buildSignedVouch({
  required Identity voucher,
  required String vouchedFingerprint,
  required int voucherDepth,
  required String previousId,
  required double lat,
  required double lon,
}) async {
  final unsigned = Observation(
    previousId: previousId,
    pseudonym: voucher.pseudonym,
    timestamp: DateTime.now().toUtc(),
    lat: lat,
    lon: lon,
    property: 'vouch',
    value: jsonEncode({
      'vouched_key': vouchedFingerprint,
      'depth': voucherDepth + 1,
      // voucher's public key bytes, so receivers can learn+verify the voucher
      'voucher_pubkey': base64Encode(voucher.publicKeyBytes),
    }),
    vantageType: 'direct',
    inference: 'I know this person.',
  );
  return voucher.sign(unsigned);
}
