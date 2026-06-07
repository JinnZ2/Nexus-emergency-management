import 'dart:async';
import 'dart:convert';
import '../models/observation.dart';
import '../gossip/mesh_transport.dart';

/// QR / MANUAL TRANSPORT — the deepest fallback in the observation class.
/// Works when every radio is dead, including Meshtastic. The human is the
/// carrier: one device shows a code, another scans it.
///
/// FIELD-FIRST DESIGN DECISION (locked): ONE observation per QR code.
///   Rationale: in field conditions — cracked screen, shaking hands, bad
///   light, someone running — getting ONE picture to scan cleanly and fast
///   beats packing many observations into a dense code that fails to scan at
///   all. A dense multi-observation code that won't resolve loses everything;
///   a single sparse code that resolves on the first try loses nothing. Speed
///   and first-try success dominate throughput here.
///
/// Because one code = one observation, there is no chunk/reassembly protocol,
/// no partial-code state, nothing to corrupt. The content-id on the decoded
/// observation is its own integrity check: if the scan garbled a byte, the
/// recomputed id won't match the embedded id and we drop it cleanly.
///
/// This transport is OBSERVATION-CLASS: it carries full signed observations
/// with content-id intact. canSend = true (the human + screen is the sender).
class ManualQrTransport implements MeshTransport {
  @override
  String get name => 'QR Code';

  @override
  bool get isRunning => _running;
  bool _running = false;

  /// QR is genuinely capable of sending a whole observation (one per code), so
  /// it is an honest sender — not a receive-only stub.
  @override
  bool get canSend => true;

  final _received = StreamController<List<Observation>>.broadcast();

  @override
  Stream<List<Observation>> get onObservationsReceived => _received.stream;

  @override
  Future<void> start() async {
    _running = true;
    // Nothing to bind. QR is human-driven: the UI calls encodeForDisplay()
    // to render a code and onCodeScanned() when the camera reads one. There is
    // no background radio to start.
  }

  @override
  Future<void> stop() async {
    _running = false;
    await _received.close();
  }

  // ---- OUTBOUND: observation -> QR payload string ----

  /// Encode ONE observation into a compact string the UI renders as a QR code.
  ///
  /// We send the canonical wire JSON. The embedded `id` lets the scanner verify
  /// integrity by recomputation; the signature (if present) travels too, so a
  /// scanned observation stays cryptographically attributable exactly like one
  /// received over radio. Nothing about QR weakens the trust model.
  ///
  /// Kept deliberately minimal — no base64 wrapping, no compression — because
  /// QR encoders handle UTF-8 JSON directly and every extra transform is
  /// another thing that can fail to round-trip in the field.
  String encodeForDisplay(Observation obs) {
    return jsonEncode(obs.toJson());
  }

  /// GossipService hands observations here when flooding. For QR, "sending"
  /// means: queue them for the human to display one at a time. We don't render
  /// UI from this layer; we expose the next-to-show queue and let the UI pull.
  ///
  /// One-per-code means we never merge a batch into a single code — each
  /// observation becomes its own code, shown in sequence by the UI.
  final List<Observation> _displayQueue = [];
  List<Observation> get displayQueue => List.unmodifiable(_displayQueue);

  @override
  Future<void> sendObservations(List<Observation> observations) async {
    // Enqueue for sequential display. The UI shows displayQueue.first as a QR
    // code, advances on a tap / after a scan-confirm, one code at a time.
    _displayQueue.addAll(observations);
  }

  /// UI calls this once a code has been shown long enough / scanned by a peer,
  /// to advance to the next observation in the sequence.
  void markDisplayed(String observationId) {
    _displayQueue.removeWhere((o) => o.id == observationId);
  }

  // ---- INBOUND: scanned QR string -> observation ----

  /// UI calls this with the raw decoded string from a scanned QR code.
  ///
  /// Integrity gate: we reconstruct the observation, which recomputes the
  /// content-id from content. If the scan corrupted the payload, either JSON
  /// parsing fails OR the recomputed id won't match the embedded id — both
  /// caught here, both result in a clean drop, never a corrupted store.
  void onCodeScanned(String raw) {
    if (!_running) return;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final embeddedId = map['id'] as String?;
      final obs = Observation.fromJson(map);

      // Recomputed id (obs.id) vs the id that was embedded at encode time.
      // Mismatch = the scan garbled content. Drop it; the human can rescan.
      if (embeddedId != null && embeddedId != obs.id) {
        return; // silent clean drop — corrupted scan, no partial state
      }
      _received.add([obs]);
    } catch (_) {
      // Unparseable scan (wrong code, smudge, partial frame). Drop cleanly.
      // One-per-code means there's no half-finished reassembly to unwind.
    }
  }
}
