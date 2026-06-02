import 'dart:convert';
import 'package:crypto/crypto.dart';

/// THE FROZEN SPINE.
///
/// One rule governs this file: identity is content, nothing else.
///
///   id        = hash(content only)         — what was observed
///   signature = sign(id, author key)       — who said it        (optional)
///   transit   = hopCount/receivedAt/...     — how it reached you (local, never trusted from wire)
///
/// Consequences that the rest of the system relies on:
///   - The same observation re-entering through ten different carriers
///     produces ten identical ids -> dedup works hardest exactly when the
///     mesh is working hardest (post-disaster, many redundant paths).
///   - A keyless node and a keyed node reporting identical content collide
///     on id and dedup correctly. Keys add provenance, not identity.
///   - hopCount/originPseudonym arrive over the wire but are NEVER trusted;
///     each receiver recomputes them from its own local view. Forging them
///     buys an attacker nothing.
class Observation {
  // ---- CONTENT (hashed into id; immutable at origin) ----
  final String previousId; // lineage pointer, NOT part of id (see note below)
  final String pseudonym; // human-facing name; may repeat across people
  final DateTime timestamp; // when the observation was made at origin
  final double lat;
  final double lon;
  final double? altitude;
  final String property; // e.g. "water_depth", "road_status", "vouch"
  final String value;
  final String? unit;
  final String vantageType; // "direct" | "indirect"
  final double? vantageLat;
  final double? vantageLon;
  final String? vantageDescription;
  final String? inference;

  // ---- AUTHORSHIP (optional; absent = keyless Level-0 node) ----
  /// Public key fingerprint of the author. Present from first launch on
  /// keyed nodes, null on legacy/keyless nodes. NOT part of id.
  final String? authorKey;

  /// Signature over `id` by the author's private key. Proves authorship.
  /// Absent on keyless nodes — those observations are still valid, just
  /// unverifiable (trust Level 0). NOT part of id.
  final String? signature;

  // ---- TRANSIT (local view; recomputed on receipt; NEVER trusted from wire) ----
  final bool isCarried; // did this arrive from another node?
  final String? originPseudonym; // who first reported it (display only)
  final int hopCount; // hops from origin, as THIS node counts them
  final DateTime? receivedAt; // when THIS node received it
  final DateTime? expiresAt; // local TTL; drop after this

  /// The frozen identity. Computed once from content only.
  late final String id;

  Observation({
    required this.previousId,
    required this.pseudonym,
    required this.timestamp,
    required this.lat,
    required this.lon,
    this.altitude,
    required this.property,
    required this.value,
    this.unit,
    required this.vantageType,
    this.vantageLat,
    this.vantageLon,
    this.vantageDescription,
    this.inference,
    this.authorKey,
    this.signature,
    this.isCarried = false,
    this.originPseudonym,
    this.hopCount = 0,
    this.receivedAt,
    this.expiresAt,
  }) {
    id = _computeId();
  }

  /// id = SHA-256 over CONTENT ONLY.
  ///
  /// Deliberately excluded:
  ///   previousId  — lineage is provenance, not identity. Including it would
  ///                 give the same observation a different id on every path,
  ///                 breaking dedup at the worst possible moment. Lineage is
  ///                 instead protected by the signature over (id, previousId)
  ///                 when a key is present.
  ///   authorKey / signature — authorship, not content.
  ///   all transit fields    — local view, not content.
  String _computeId() {
    final content = {
      'pseudonym': pseudonym,
      'timestamp': timestamp.toUtc().toIso8601String(),
      'lat': lat,
      'lon': lon,
      'altitude': altitude,
      'property': property,
      'value': value,
      'unit': unit,
      'vantage_type': vantageType,
      'vantage_lat': vantageLat,
      'vantage_lon': vantageLon,
      'vantage_description': vantageDescription,
      'inference': inference,
    };
    final canonical = jsonEncode(_sortKeys(content));
    return sha256.convert(utf8.encode(canonical)).toString();
  }

  /// Canonical ordering so id is deterministic across devices/locales.
  static Map<String, dynamic> _sortKeys(Map<String, dynamic> m) {
    final keys = m.keys.toList()..sort();
    return {for (final k in keys) k: m[k]};
  }

  /// What the signature must be computed over: id bound to lineage.
  /// Signing (id + previousId) makes both content AND position-in-chain
  /// tamper-evident without polluting the id itself.
  String get signingPayload => '$id|$previousId';

  /// True if this observation carries a verifiable author claim.
  /// (Verification of the signature itself lives in the identity layer.)
  bool get isSigned => authorKey != null && signature != null;

  // ---- wire format ----
  Map<String, dynamic> toJson() => {
        'id': id, // included for convenience/debugging; receiver RECOMPUTES, never trusts
        'previous_id': previousId,
        'pseudonym': pseudonym,
        'timestamp': timestamp.toUtc().toIso8601String(),
        'lat': lat,
        'lon': lon,
        'altitude': altitude,
        'property': property,
        'value': value,
        'unit': unit,
        'vantage_type': vantageType,
        'vantage_lat': vantageLat,
        'vantage_lon': vantageLon,
        'vantage_description': vantageDescription,
        'inference': inference,
        'author_key': authorKey,
        'signature': signature,
        // transit fields are sent but the receiver overwrites with its own view
        'is_carried': isCarried,
        'origin_pseudonym': originPseudonym,
        'hop_count': hopCount,
        'received_at': receivedAt?.toUtc().toIso8601String(),
        'expires_at': expiresAt?.toUtc().toIso8601String(),
      };

  /// Parse from wire. Transit fields are read but treated as UNTRUSTED hints;
  /// GossipService is responsible for overwriting hopCount/receivedAt/expiresAt
  /// from the local view before storage. The `id` field from the wire is
  /// discarded — we recompute from content and (optionally) compare.
  factory Observation.fromJson(Map<String, dynamic> json) {
    final obs = Observation(
      previousId: json['previous_id'] ?? 'genesis',
      pseudonym: json['pseudonym'] ?? 'unknown',
      timestamp: DateTime.parse(json['timestamp']),
      lat: (json['lat'] as num).toDouble(),
      lon: (json['lon'] as num).toDouble(),
      altitude: (json['altitude'] as num?)?.toDouble(),
      property: json['property'],
      value: json['value'].toString(),
      unit: json['unit'],
      vantageType: json['vantage_type'] ?? 'direct',
      vantageLat: (json['vantage_lat'] as num?)?.toDouble(),
      vantageLon: (json['vantage_lon'] as num?)?.toDouble(),
      vantageDescription: json['vantage_description'],
      inference: json['inference'],
      authorKey: json['author_key'],
      signature: json['signature'],
      isCarried: json['is_carried'] ?? false,
      originPseudonym: json['origin_pseudonym'],
      hopCount: json['hop_count'] ?? 0,
      receivedAt: json['received_at'] != null
          ? DateTime.parse(json['received_at'])
          : null,
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'])
          : null,
    );
    return obs;
  }

  /// Produce a copy with this node's local transit view stamped on.
  /// Called by GossipService on receipt. Content (and therefore id) is
  /// unchanged — only the local how-it-got-here fields move.
  Observation withLocalTransit({
    required bool isCarried,
    String? originPseudonym,
    required int hopCount,
    required DateTime receivedAt,
    required DateTime expiresAt,
  }) {
    return Observation(
      previousId: previousId,
      pseudonym: pseudonym,
      timestamp: timestamp,
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
      authorKey: authorKey,
      signature: signature,
      isCarried: isCarried,
      originPseudonym: originPseudonym,
      hopCount: hopCount,
      receivedAt: receivedAt,
      expiresAt: expiresAt,
    );
  }
}
