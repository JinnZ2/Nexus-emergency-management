import 'dart:convert';
import '../models/observation.dart';

/// TRUST LAYER — safety first, security optional.
///
/// Design law (from the purpose: get people safe; help may be far off):
///   1. The system NEVER asks a human to understand cryptography.
///      Keys are generated, signed, and verified invisibly or not at all.
///   2. A node with no setup time joins keyless in one tap and its reports
///      COUNT. A stranger yelling "the bridge is out" is never silenced for
///      lacking a key.
///   3. Trust is layered ON TOP for communities that had time to prepare,
///      and it spreads transitively so it does not die with whoever is out
///      of range.
///
/// Trust levels (what the human sees vs. what's underneath):
///   Level 0  UNVOUCHED  — anyone who joined. Reports show + get
///                         contradiction-checked. Human sees: just a name.
///   Level 1+ VOUCHED    — someone tapped "I know this person." Human sees:
///                         a check mark. Underneath: their pubkey got signed.
///
/// A vouch is itself an Observation (property == "vouch"), so it rides the
/// exact same gossip / carry / chain machinery as any report. Trust spreads
/// like rumor — the correct physics for a village nervous system.

const String kVouchProperty = 'vouch';

/// A single vouch edge, parsed out of a vouch-observation.
class VouchEdge {
  final String voucherKey;
  final String vouchedKey;
  final bool signed; // was the vouch itself signed by the voucher?

  const VouchEdge({
    required this.voucherKey,
    required this.vouchedKey,
    required this.signed,
  });

  static VouchEdge? fromObservation(Observation obs) {
    if (obs.property != kVouchProperty) return null;
    if (obs.authorKey == null) return null; // an unsigned/keyless vouch is meaningless
    try {
      final m = jsonDecode(obs.value);
      final vouchedKey = m['vouched_key'];
      if (vouchedKey == null) return null;
      return VouchEdge(
        voucherKey: obs.authorKey!,
        vouchedKey: vouchedKey,
        signed: obs.isSigned,
      );
    } catch (_) {
      return null;
    }
  }
}

/// Computes trust for every key the node has heard of, from the set of
/// vouch edges floating in the mesh. Pure function of the edges — no state,
/// recomputable any time new vouches arrive (same pattern as the policy
/// re-evaluation you already designed).
class TrustGraph {
  /// keys known to be original/preplanned organizers (depth 0, full weight).
  /// Established at preplan time via in-person QR exchange ("add my neighbors"),
  /// never shown to the user as keys.
  final Set<String> originalOrganizers;

  /// How fast trust decays per hop of vouching distance.
  /// weight = decayBase ^ depth. 1.0 = no decay (flat trust).
  /// Lower = trust the far-from-origin less. Tunable via epistemic policy.
  final double decayBase;

  TrustGraph({
    required this.originalOrganizers,
    this.decayBase = 0.8,
  });

  /// Resolve effective trust weight for every key, taking the SHORTEST
  /// vouch path back to any original organizer (best evidence wins).
  ///
  /// Returns weight in [0, 1]:
  ///   original organizer      -> 1.0
  ///   vouched at depth d       -> decayBase^d
  ///   never vouched (Level 0)  -> floorWeight (NOT zero — see below)
  Map<String, double> resolve(
    List<Observation> allObservations, {
    double floorWeight = 0.25,
  }) {
    // Gather edges.
    final edges = <VouchEdge>[];
    for (final obs in allObservations) {
      final e = VouchEdge.fromObservation(obs);
      if (e != null) edges.add(e);
    }

    // Shortest depth to an original organizer, via BFS over vouch edges.
    final depthOf = <String, int>{};
    for (final k in originalOrganizers) {
      depthOf[k] = 0;
    }

    // Index edges by voucher so we can expand outward.
    final byVoucher = <String, List<VouchEdge>>{};
    for (final e in edges) {
      byVoucher.putIfAbsent(e.voucherKey, () => []).add(e);
    }

    // BFS frontier from organizers outward.
    var frontier = Set<String>.from(originalOrganizers);
    while (frontier.isNotEmpty) {
      final next = <String>{};
      for (final voucher in frontier) {
        final voucherDepth = depthOf[voucher]!;
        for (final e in byVoucher[voucher] ?? const <VouchEdge>[]) {
          if (!e.signed) continue; // only signed vouches carry trust
          final candidateDepth = voucherDepth + 1;
          final known = depthOf[e.vouchedKey];
          if (known == null || candidateDepth < known) {
            depthOf[e.vouchedKey] = candidateDepth;
            next.add(e.vouchedKey);
          }
        }
      }
      frontier = next;
    }

    // Convert depths to weights. Every key ever seen as an author gets at
    // least the floor — a Level-0 stranger is trusted LESS, never zero,
    // because in a disaster their report may be the only one and may be true.
    final weights = <String, double>{};
    final seenKeys = <String>{};
    for (final obs in allObservations) {
      if (obs.authorKey != null) seenKeys.add(obs.authorKey!);
    }
    seenKeys.addAll(depthOf.keys);

    for (final k in seenKeys) {
      final d = depthOf[k];
      if (d == null) {
        weights[k] = floorWeight; // unvouched but present
      } else {
        weights[k] = _pow(decayBase, d);
      }
    }
    return weights;
  }

  static double _pow(double base, int exp) {
    var r = 1.0;
    for (var i = 0; i < exp; i++) {
      r *= base;
    }
    return r;
  }
}
