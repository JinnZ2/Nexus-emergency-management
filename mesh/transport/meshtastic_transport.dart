import 'dart:async';
import 'dart:convert';
import '../models/observation.dart';
import 'mesh_transport.dart';

/// MESHTASTIC TRANSPORT — observation-class, the long-range radio tier.
///
/// This is the field kit's real reach: a 915MHz Meshtastic radio (T114 /
/// RAK4631) driven over serial from the RPi. Range is miles, not a room — it's
/// what connects Grange Hall to the farm 8 miles out when every other link is
/// dead.
///
/// THE HARD PART: a Meshtastic text payload is small (~200 usable bytes after
/// overhead; we budget conservatively). A signed observation is ~400-600 bytes
/// of JSON. So this is the FIRST transport where one observation does NOT fit
/// in one packet. It must be chunked on send and reassembled on receive.
///
/// Reassembly is exactly where the spine pays off again: each chunk carries the
/// observation's content-id. The receiver collects chunks under that id, and
/// when complete, RECONSTRUCTS the observation and recomputes its id. If a
/// chunk was lost, duplicated, or corrupted, the recomputed id won't match —
/// the whole observation is dropped, never half-stored. Content-addressing is
/// the reassembly checksum; we don't invent a separate one.
///
/// Chunk wire format (one Meshtastic text message per chunk), pipe-delimited so
/// it survives Meshtastic's text channel without binary issues:
///
///   "S|<cid8>|<seq>|<total>|<b64chunk>"
///
///   cid8    first 8 hex chars of the observation content-id — the reassembly
///           key. Short to save bytes; collisions across simultaneously-in-
///           flight observations are astronomically unlikely at field scale,
///           and the full-id recompute at the end catches any that slip.
///   seq     this chunk's index (0-based)
///   total   total chunk count for this observation
///   b64     base64 of this slice of the observation JSON
///
/// One Meshtastic message = one chunk. Lost chunks just mean the observation
/// never completes and is dropped — the sender re-broadcasts on the next sync,
/// and the carry/flood machinery gives it more chances. No ACK protocol: ACKs
/// over a lossy, high-latency, low-bandwidth radio cost more than they save.
class MeshtasticTransport implements MeshTransport {
  @override
  String get name => 'Meshtastic Radio';

  @override
  bool get isRunning => _running;
  bool _running = false;

  @override
  bool get canSend => true;

  /// Usable payload budget per Meshtastic text message, in bytes, for the
  /// base64 chunk slice ONLY (header overhead is accounted separately). Kept
  /// conservative; Meshtastic's hard cap is ~237 bytes total and we leave room
  /// for the "S|cid8|seq|total|" header.
  final int chunkPayloadBytes;

  /// Injected I/O so this is testable and not bound to a specific serial lib.
  /// sendLine: hand one chunk string to the radio (e.g. `meshtastic --sendtext`).
  /// The host wires incoming radio text lines into [onRadioLine].
  final Future<void> Function(String line) sendLine;

  final _received = StreamController<List<Observation>>.broadcast();

  /// Reassembly buffers: cid8 -> partial state.
  final Map<String, _Reassembly> _pending = {};

  /// How long to keep an incomplete reassembly before giving up on it. A
  /// half-arrived observation whose missing chunks never come must not leak
  /// memory forever; the sender will re-broadcast whole anyway.
  final Duration reassemblyTtl;

  Timer? _gcTimer;

  MeshtasticTransport({
    required this.sendLine,
    this.chunkPayloadBytes = 150,
    this.reassemblyTtl = const Duration(minutes: 5),
  });

  @override
  Stream<List<Observation>> get onObservationsReceived => _received.stream;

  @override
  Future<void> start() async {
    _running = true;
    // Periodically discard stale partial reassemblies.
    _gcTimer = Timer.periodic(const Duration(minutes: 1), (_) => _gc());
  }

  @override
  Future<void> stop() async {
    _running = false;
    _gcTimer?.cancel();
    _pending.clear();
    await _received.close();
  }

  // ---- OUTBOUND: observation -> chunks -> radio ----

  @override
  Future<void> sendObservations(List<Observation> observations) async {
    if (!_running) return;
    for (final obs in observations) {
      final json = jsonEncode(obs.toJson());
      final cid8 = obs.id.substring(0, 8);
      final chunks = _split(utf8.encode(json), chunkPayloadBytes);
      final total = chunks.length;
      for (var seq = 0; seq < total; seq++) {
        final b64 = base64Encode(chunks[seq]);
        final line = 'S|$cid8|$seq|$total|$b64';
        await sendLine(line);
        // a small gap avoids overrunning the radio's TX queue; Meshtastic is
        // slow and bursting all chunks at once drops some.
        await Future.delayed(const Duration(milliseconds: 50));
      }
    }
  }

  static List<List<int>> _split(List<int> bytes, int size) {
    final out = <List<int>>[];
    for (var i = 0; i < bytes.length; i += size) {
      out.add(bytes.sublist(i, i + size > bytes.length ? bytes.length : i + size));
    }
    if (out.isEmpty) out.add(const []); // degenerate empty -> one empty chunk
    return out;
  }

  // ---- INBOUND: radio line -> reassembly -> observation ----

  /// The host calls this with each text line received from the radio.
  void onRadioLine(String line) {
    if (!_running) return;
    final parts = line.split('|');
    if (parts.length != 5 || parts[0] != 'S') return; // not our framing

    final cid8 = parts[1];
    final seq = int.tryParse(parts[2]);
    final total = int.tryParse(parts[3]);
    final b64 = parts[4];
    if (seq == null || total == null || total <= 0 || seq < 0 || seq >= total) {
      return; // malformed header
    }

    List<int> chunk;
    try {
      chunk = base64Decode(b64);
    } catch (_) {
      return; // corrupt base64 — drop this chunk
    }

    final r = _pending.putIfAbsent(
      cid8,
      () => _Reassembly(total: total, createdAt: DateTime.now()),
    );

    // total mismatch across chunks of the "same" cid8 => something's wrong
    // (collision or corruption). Reset to the newer claim rather than blend.
    if (r.total != total) {
      _pending[cid8] = _Reassembly(total: total, createdAt: DateTime.now());
    }
    final cur = _pending[cid8]!;
    cur.chunks[seq] = chunk;

    if (cur.chunks.length == cur.total) {
      _tryComplete(cid8, cur);
    }
  }

  void _tryComplete(String cid8, _Reassembly r) {
    // Assemble in sequence order.
    final buf = <int>[];
    for (var i = 0; i < r.total; i++) {
      final c = r.chunks[i];
      if (c == null) return; // not actually complete (shouldn't happen)
      buf.addAll(c);
    }
    _pending.remove(cid8);

    try {
      final map = jsonDecode(utf8.decode(buf)) as Map<String, dynamic>;
      final embeddedId = map['id'] as String?;
      final obs = Observation.fromJson(map);
      // THE reassembly checksum: recomputed content-id must match what was
      // sent. A lost/dup/corrupt chunk that still assembled into valid JSON
      // is caught here. Mismatch => drop whole, never store partial.
      if (embeddedId != null && embeddedId != obs.id) return;
      _received.add([obs]);
    } catch (_) {
      // assembled bytes weren't valid observation JSON — drop cleanly
    }
  }

  void _gc() {
    final cutoff = DateTime.now().subtract(reassemblyTtl);
    _pending.removeWhere((_, r) => r.createdAt.isBefore(cutoff));
  }
}

/// Partial reassembly state for one in-flight observation.
class _Reassembly {
  final int total;
  final DateTime createdAt;
  final Map<int, List<int>> chunks = {}; // seq -> bytes

  _Reassembly({required this.total, required this.createdAt});
}
