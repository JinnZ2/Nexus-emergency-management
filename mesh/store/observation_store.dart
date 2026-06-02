import '../models/observation.dart';

/// STORAGE CONTRACT.
///
/// The one invariant the rest of the system leans on:
///   dedup is keyed on content-id (Observation.id), nothing else.
///
/// Because id = hash(content only), the same observation arriving by ten
/// routes hits `exists()` true after the first store. Transit fields
/// (hopCount/receivedAt/expiresAt/isCarried) live in their own columns so a
/// later arrival can UPDATE the local transit view (e.g. a shorter path was
/// found) WITHOUT creating a duplicate and WITHOUT touching content.
///
/// Implementations: SqliteStore (desktop/Pi/server via FFI). A mobile impl
/// backed by the app's sqflite can implement this same interface so
/// GossipService is storage-agnostic.
abstract class ObservationStore {
  Future<void> init();

  /// Store if new (by content-id). Returns true if this was a NEW observation,
  /// false if already known. Callers use the return value to decide whether to
  /// forward onward — never re-flood something already stored.
  Future<bool> add(Observation obs);

  /// True if an observation with this content-id is already stored.
  Future<bool> exists(String id);

  /// All stored observations, newest first.
  Future<List<Observation>> getAll();

  /// Only observations that originated on THIS node (not carried for others).
  Future<List<Observation>> getLocalObservations();

  /// Carried observations still eligible to forward: under hop limit and
  /// not expired. These are what a node offers when it meets a peer.
  Future<List<Observation>> getCarriedObservations({int maxHopCount});

  /// Count of currently-carried, non-expired observations (for the UI badge).
  Future<int> getCarriedCount();

  /// Most recent observation id authored locally, for chaining previousId.
  /// Returns 'genesis' if this node has authored nothing yet.
  Future<String> lastLocalId(String localPseudonym);

  /// If a known observation arrives via a SHORTER path, lower its stored
  /// hopCount and refresh receivedAt. Content/id untouched. No-op if the new
  /// path isn't shorter. Keeps the carry graph honest without duplicating.
  Future<void> improveTransit(Observation obs);

  /// Drop expired carried observations. Called periodically.
  Future<int> pruneExpired();

  Future<void> close();
}
