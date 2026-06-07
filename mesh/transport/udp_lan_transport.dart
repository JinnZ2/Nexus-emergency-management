import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../models/observation.dart';
import '../gossip/mesh_transport.dart';

/// UDP / LAN MULTICAST TRANSPORT — observation-class, flood-local.
///
/// From TRDAP seed-protocol v4 (multicast LAN mesh), adapted to carry whole
/// signed observations instead of seed packets. On a local network the MTU is
/// large and bandwidth is effectively free, so the strategy is FLOOD, not
/// route: broadcast every new observation to the multicast group and let the
/// store's content-id dedup absorb the repeats. Dumb and robust beats clever
/// and fragile when bandwidth isn't the constraint.
///
/// Why flood here (and route only over LoRa later): on LAN a duplicate packet
/// costs nothing and guarantees delivery across the segment in one hop. Seed-
/// gradient routing earns its complexity only when each transmission is
/// expensive (LoRa). This transport is the "cheap and certain" tier.
///
/// SEED DISCOVERY: alongside observations, nodes emit a tiny periodic presence
/// beacon so peers know who's on the segment. This is the seed-protocol's
/// discovery role, kept SEPARATE from observation content — presence beacons
/// describe NODES (who's here), observations describe TRUTH (what's reported).
/// They never mix; a beacon never becomes an observation and vice versa.
class UdpLanTransport implements MeshTransport {
  @override
  String get name => 'Local Network';

  @override
  bool get isRunning => _running;
  bool _running = false;

  @override
  bool get canSend => true;

  /// Multicast group + port. 239.x is the admin-scoped (site-local) range —
  /// stays on the local segment, won't leak to the wider internet even if a
  /// gateway is misconfigured. Correct default for a disaster LAN.
  final InternetAddress group;
  final int port;

  /// How often to emit a presence beacon (seed-discovery).
  final Duration beaconInterval;

  /// A short stable handle for THIS node, used only in presence beacons so
  /// peers can list who's around. Not an identity claim — observations carry
  /// the real signed authorship. This is just "a node is here."
  final String nodeHandle;

  RawDatagramSocket? _sock;
  Timer? _beaconTimer;
  final _received = StreamController<List<Observation>>.broadcast();

  /// Peers seen via presence beacons: handle -> last-seen time. Exposed so the
  /// UI / a higher routing layer can show "who's nearby" — the seed-discovery
  /// product. Pruned on read; a peer unseen for 3 beacon intervals is gone.
  final Map<String, DateTime> _peers = {};

  UdpLanTransport({
    InternetAddress? group,
    this.port = 50671,
    this.beaconInterval = const Duration(seconds: 10),
    required this.nodeHandle,
  }) : group = group ?? InternetAddress('239.7.7.7');

  @override
  Stream<List<Observation>> get onObservationsReceived => _received.stream;

  @override
  Future<void> start() async {
    if (_running) return;
    _sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, port,
        reuseAddress: true, reusePort: true);
    _sock!.joinMulticast(group);
    _sock!.multicastLoopback = false; // don't hear our own broadcasts
    _running = true;

    _sock!.listen(_onDatagram);

    // Begin presence beaconing (seed-discovery).
    _beaconTimer = Timer.periodic(beaconInterval, (_) => _sendBeacon());
    _sendBeacon(); // announce immediately on join
  }

  @override
  Future<void> stop() async {
    _running = false;
    _beaconTimer?.cancel();
    try {
      _sock?.leaveMulticast(group);
    } catch (_) {}
    _sock?.close();
    _sock = null;
    await _received.close();
  }

  // ---- wire envelope ----
  // Two message kinds share the group, tagged by a one-char prefix so a beacon
  // is never mistaken for an observation:
  //   'O' + json  -> a single observation
  //   'B' + handle -> a presence beacon
  // One observation per datagram (LAN MTU easily fits a ~600B observation;
  // no fragmentation, no reassembly — same robustness principle as QR).

  @override
  Future<void> sendObservations(List<Observation> observations) async {
    final s = _sock;
    if (s == null || !_running) return;
    for (final obs in observations) {
      final payload = 'O${jsonEncode(obs.toJson())}';
      final bytes = utf8.encode(payload);
      // If an observation ever exceeds the datagram budget, we drop rather than
      // fragment — fragmenting reintroduces partial-state corruption. In
      // practice observations are well under a single UDP datagram on LAN.
      if (bytes.length > 60000) continue; // theoretical guard; never hit in practice
      s.send(bytes, group, port);
    }
  }

  void _sendBeacon() {
    final s = _sock;
    if (s == null || !_running) return;
    final bytes = utf8.encode('B$nodeHandle');
    s.send(bytes, group, port);
  }

  void _onDatagram(RawSocketEvent event) {
    if (event != RawSocketEvent.read) return;
    final dg = _sock?.receive();
    if (dg == null) return;

    final data = utf8.decode(dg.data, allowMalformed: true);
    if (data.isEmpty) return;

    final kind = data[0];
    final body = data.substring(1);

    if (kind == 'B') {
      // Presence beacon — record the peer, do NOT treat as observation.
      if (body.isNotEmpty && body != nodeHandle) {
        _peers[body] = DateTime.now();
      }
      return;
    }

    if (kind == 'O') {
      try {
        final map = jsonDecode(body) as Map<String, dynamic>;
        final embeddedId = map['id'] as String?;
        final obs = Observation.fromJson(map);
        // Same integrity gate as QR: a corrupted datagram whose recomputed id
        // doesn't match the embedded id is dropped, never stored.
        if (embeddedId != null && embeddedId != obs.id) return;
        _received.add([obs]);
      } catch (_) {
        // malformed observation datagram — drop cleanly
      }
    }
    // unknown kind -> ignore
  }

  /// Current nearby peers (seed-discovery output). Prunes stale entries: a peer
  /// not heard from in 3 beacon intervals is considered gone.
  List<String> nearbyPeers() {
    final cutoff = DateTime.now().subtract(beaconInterval * 3);
    _peers.removeWhere((_, seen) => seen.isBefore(cutoff));
    return _peers.keys.toList();
  }
}
