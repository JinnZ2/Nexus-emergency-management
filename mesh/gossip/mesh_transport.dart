import 'dart:async';
import '../models/observation.dart';

/// TRANSPORT CONTRACT.
///
/// A transport is a physical-layer pipe for observations: BLE, Wi-Fi/TCP,
/// manual QR, LoRa. GossipService orchestrates across all active transports
/// and does not care how bytes travel.
///
/// Hard rule learned from the first draft's failure: a transport MUST NOT
/// silently no-op sendObservations. Either it genuinely sends, or it declares
/// itself receive-only via [canSend] == false so the orchestrator knows not to
/// rely on it for forwarding. A pipe that lies about sending breaks multi-hop
/// carry invisibly.
abstract class MeshTransport {
  /// Human-readable name for any UI ("Bluetooth", "QR Code", "Local Network").
  String get name;

  /// Whether this transport is currently active.
  bool get isRunning;

  /// Whether this transport can actually push observations outward.
  /// Receive-only transports (e.g. a scan-only fallback) return false, and
  /// GossipService will not attempt to forward through them. Honest by
  /// contract — no silent no-ops.
  bool get canSend;

  /// Start listening/sending.
  Future<void> start();

  /// Stop and release resources.
  Future<void> stop();

  /// Observations received from remote peers via this transport. GossipService
  /// subscribes once at init; the transport pushes batches as they arrive.
  Stream<List<Observation>> get onObservationsReceived;

  /// Send observations to reachable peers. Implementations decide addressing
  /// (broadcast, directed, queued-until-peer-seen). If [canSend] is false this
  /// is allowed to be a no-op — but ONLY then, and the orchestrator already
  /// knows not to call it.
  Future<void> sendObservations(List<Observation> observations);
}
