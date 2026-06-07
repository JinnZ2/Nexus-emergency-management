import 'dart:convert';
import '../models/observation.dart';
import '../identity/trust_graph.dart';

/// EPISTEMIC POLICY — the community votes on its own rules of evidence.
///
/// Closes the trust loop. Until now decayBase (how fast vouching trust fades
/// with distance) and floorWeight (how much an unvouched stranger counts) were
/// HARDCODED constants in TrustGraph. That made the developer the silent
/// arbiter of how the community weighs evidence. This layer takes that decision
/// away from the developer and gives it to the community: policies are proposed,
/// gossiped, and adopted exactly like any observation, and the active policy
/// drives those parameters.
///
/// A policy is an Observation (property:"epistemic_policy"). An adoption is an
/// Observation (property:"policy_adoption", value:<policy content-id>). Both
/// ride the existing gossip/carry/sign/trust machinery — no new transport, no
/// new storage. The mesh governs itself on the same rails it reports on.
///
/// THE SYBIL DEFENSE (the warrior-class capture vector, in digital form):
/// adoption is NOT one-pseudonym-one-vote. A pseudonym is free to mint, so
/// counting raw pseudonyms lets one device fake a majority and rewrite the
/// rules of evidence. Instead adoption is counted by SIGNED DISTINCT KEYS,
/// each WEIGHTED BY TRUST. An unvouched key minted for the attack carries only
/// floor weight; vouched keys carry decayed-by-distance weight; organizers
/// carry full weight. Faking a policy majority now costs real, vouched,
/// trusted identities — expensive, not free. This does not make Sybil
/// impossible; it makes it costly, which is the honest bar.

const String kPolicyProperty = 'epistemic_policy';
const String kAdoptionProperty = 'policy_adoption';

/// The voted parameters. These are exactly the knobs that were hardcoded.
class EpistemicPolicy {
  final String id; // content-id of the proposing observation
  final String name; // human label ("Tight trust", "Open disaster")
  final String author; // proposer fingerprint/pseudonym

  /// Trust decay per vouch hop (TrustGraph.decayBase). 1.0 = no decay.
  final double decayBase;

  /// Floor weight for unvouched-but-present keys (TrustGraph floorWeight).
  /// NEVER 0 — a stranger is trusted less, never silenced.
  final double floorWeight;

  /// Fraction of total trust-weight that must adopt a policy before it becomes
  /// active. e.g. 0.6 = policies need 60% of weighted adoption to take effect.
  final double adoptionThreshold;

  const EpistemicPolicy({
    required this.id,
    required this.name,
    required this.author,
    required this.decayBase,
    required this.floorWeight,
    required this.adoptionThreshold,
  });

  /// The default the mesh runs under before any policy is adopted. Safety-first
  /// values: gentle decay, a real (non-zero) floor so strangers are heard, a
  /// simple majority-ish threshold.
  factory EpistemicPolicy.defaults() => const EpistemicPolicy(
        id: 'default',
        name: 'Sovereign Default',
        author: 'system',
        decayBase: 0.8,
        floorWeight: 0.25,
        adoptionThreshold: 0.6,
      );

  Map<String, dynamic> toParams() => {
        'name': name,
        'decay_base': decayBase,
        'floor_weight': floorWeight,
        'adoption_threshold': adoptionThreshold,
      };

  static EpistemicPolicy? fromObservation(Observation o) {
    if (o.property != kPolicyProperty) return null;
    try {
      final m = jsonDecode(o.inference ?? '{}');
      return EpistemicPolicy(
        id: o.id,
        name: m['name'] ?? 'Unnamed',
        author: o.authorKey ?? o.pseudonym,
        decayBase: (m['decay_base'] as num?)?.toDouble() ?? 0.8,
        // Clamp to a safe minimum — a proposal with floorWeight 0 would silently
        // break the "strangers are heard, just weighted less" guarantee.
        floorWeight: ((m['floor_weight'] as num?)?.toDouble() ?? 0.25).clamp(0.01, 1.0),
        adoptionThreshold:
            (m['adoption_threshold'] as num?)?.toDouble() ?? 0.6,
      );
    } catch (_) {
      return null;
    }
  }
}

/// Resolves which policy is currently active, from the stored observations.
/// Pure function of (observations + organizer set) — recompute any time new
/// policies/adoptions arrive, same pattern as TrustGraph.
class PolicyResolver {
  final Set<String> organizers;

  PolicyResolver({required this.organizers});

  /// Compute the active policy.
  ///
  /// Steps:
  ///   1. Gather all proposed policies.
  ///   2. Gather all adoptions (signed; unsigned adoptions don't count — an
  ///      adoption you can't attribute to a key can't be trust-weighted).
  ///   3. For each policy, sum the TRUST WEIGHT of the DISTINCT KEYS that
  ///      adopted it (latest adoption per key wins). Weights come from the
  ///      CURRENT trust graph, itself parameterized by the currently-active
  ///      policy — we use the default graph params to score adoption, avoiding
  ///      a circular "a policy votes itself in by its own rules" exploit.
  ///   4. A policy whose adopted-weight / total-weight >= its adoptionThreshold
  ///      becomes active. If several qualify, the highest weighted wins.
  ///   5. None qualify -> defaults stay active.
  EpistemicPolicy resolve(List<Observation> all) {
    final policies = <String, EpistemicPolicy>{};
    for (final o in all) {
      final p = EpistemicPolicy.fromObservation(o);
      if (p != null) policies[p.id] = p;
    }
    if (policies.isEmpty) return EpistemicPolicy.defaults();

    // Score adoption using NEUTRAL (default) trust params, not any candidate
    // policy's own params — prevents a policy from rigging the very weights
    // used to adopt it.
    final neutralGraph = TrustGraph(
      originalOrganizers: organizers,
      decayBase: EpistemicPolicy.defaults().decayBase,
    );
    final weights = neutralGraph.resolve(
      all,
      floorWeight: EpistemicPolicy.defaults().floorWeight,
    );

    final totalWeight =
        weights.values.fold<double>(0.0, (a, b) => a + b);
    if (totalWeight <= 0) return EpistemicPolicy.defaults();

    // latest signed adoption per key: key -> policyId
    final latestAdoption = <String, String>{};
    final latestAt = <String, DateTime>{};
    for (final o in all) {
      if (o.property != kAdoptionProperty) continue;
      if (o.authorKey == null) continue; // unsigned adoption can't be weighted
      final key = o.authorKey!;
      final prev = latestAt[key];
      if (prev == null || o.timestamp.isAfter(prev)) {
        latestAt[key] = o.timestamp;
        latestAdoption[key] = o.value; // value = adopted policy id
      }
    }

    // sum adopted weight per policy
    final adoptedWeight = <String, double>{};
    latestAdoption.forEach((key, policyId) {
      final w = weights[key] ?? 0.0;
      adoptedWeight[policyId] = (adoptedWeight[policyId] ?? 0.0) + w;
    });

    // pick the highest-weighted policy that clears its own threshold
    EpistemicPolicy? winner;
    double winnerWeight = 0;
    policies.forEach((id, policy) {
      final w = adoptedWeight[id] ?? 0.0;
      final frac = w / totalWeight;
      if (frac >= policy.adoptionThreshold && w > winnerWeight) {
        winner = policy;
        winnerWeight = w;
      }
    });

    return winner ?? EpistemicPolicy.defaults();
  }
}

/// Build the `inference` string for a policy PROPOSAL observation.
/// Returns pre-encoded JSON so the caller can pass it directly to
/// gossip.report(inference: buildPolicyProposalContent(...)) without a
/// separate jsonEncode step (which was easy to forget).
String buildPolicyProposalContent({
  required String name,
  required double decayBase,
  required double floorWeight,
  required double adoptionThreshold,
}) {
  return jsonEncode({
    'name': name,
    'decay_base': decayBase,
    'floor_weight': floorWeight.clamp(0.01, 1.0), // enforce floor here too
    'adoption_threshold': adoptionThreshold,
  });
}
