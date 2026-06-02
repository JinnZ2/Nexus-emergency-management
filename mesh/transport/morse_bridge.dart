import 'dart:async';
import '../models/observation.dart';
import 'mesh_transport.dart';

/// MORSE BRIDGE — the transport that breaks the transport mold on purpose.
///
/// Every other transport is a PIPE: hand it any observation, it carries the
/// whole content-addressed thing with integrity intact. Morse cannot do that.
/// A content-id is 64 hex characters; "SOS" is 9 blinks of a dying flashlight.
/// You cannot push a signed observation through light/sound/vibration at any
/// speed a human in a disaster will tolerate. So forcing Morse to be a pipe
/// would mean truncating the hash (breaks dedup) or transmitting for minutes
/// per report (useless). We refuse both.
///
/// Instead Morse is a BRIDGE, asymmetric by design:
///
///   INBOUND  (signal -> observation):  a detected distress signal — SOS via
///            flashlight, horn, tapping on a pipe, radio CW — is turned into a
///            real, locally-authored observation (property:"distress") that
///            then flows through the REAL transports (#1-#3) with full content-
///            id integrity and signing. The flashlight didn't carry an
///            observation; it TRIGGERED one. Integrity is created at the bridge,
///            on this device, not transmitted over the light.
///
///   OUTBOUND (observation -> signal):  only observations matching a small set
///            of PRE-AGREED priority codes (SOS/HELP/FIRE/MEDIC/...) are emitted
///            as Morse, as their short human-readable code — NOT as their data.
///            An arbitrary observation is NOT sendable as Morse.
///
/// Therefore canSend == false: GossipService's _floodToAll already skips
/// transports that report canSend false, so the orchestrator will never try to
/// push a generic observation through Morse. The bridge's outbound path is
/// driven explicitly by [beaconIfPriority], not by the flood loop. This is the
/// honest-no-op contract from mesh_transport.dart working exactly as intended.
///
/// SAFETY ROLE: this is the deepest fallback below every radio. When BLE,
/// Meshtastic, UDP, and even QR (needs two working screens) are unavailable, a
/// human can still tap "... --- ..." on the hub case and a deaf neighbor can
/// feel it through a bed frame. The bridge ensures that signal still becomes a
/// first-class observation the moment any digital link returns.
class MorseBridge implements MeshTransport {
  @override
  String get name => 'Morse (light/audio/tactile)';

  @override
  bool get isRunning => _running;
  bool _running = false;

  /// THE defining property. Morse cannot carry an arbitrary observation, so it
  /// declares itself a non-sender. GossipService will not route generic
  /// observations here. Outbound is the explicit priority-beacon path only.
  @override
  bool get canSend => false;

  /// Emits observations SYNTHESIZED from detected distress signals. These are
  /// authored locally (this device witnessed the signal), so the host is
  /// expected to SIGN them via Identity before they enter the store/flood —
  /// same as any local report. The bridge produces the content; signing +
  /// storage is the host/gossip path, identical to a typed report.
  final _received = StreamController<List<Observation>>.broadcast();

  /// Where this device is, stamped onto synthesized distress observations.
  /// Supplied by the host (GPS or the hub's configured location). Without a
  /// position a distress report is far less actionable, but we still emit it.
  final double Function() currentLat;
  final double Function() currentLon;

  /// The host's emitter: given a Morse string ("... --- ..."), drive whatever
  /// output is available — LED, buzzer, vibration motor, relay to a horn,
  /// servo heliograph, radio CW. The bridge decides WHAT to send; the host
  /// knows HOW on this hardware. Injected for the same testability reason as
  /// the Meshtastic sendLine.
  final Future<void> Function(String morse) emitMorse;

  MorseBridge({
    required this.currentLat,
    required this.currentLon,
    required this.emitMorse,
  });

  /// Pre-agreed priority codes. The ONLY observations Morse will emit outbound,
  /// and the distress vocabulary it recognizes inbound. Kept tiny on purpose —
  /// a shared, memorized, unambiguous set is what makes Morse usable by anyone
  /// "with anything, in any condition." Mirrors TRDAP's MORSE_PRIORITIES.
  static const Map<String, String> priorityCodes = {
    'SOS': '... --- ...',
    'HELP': '.... . .-.. .--.',
    'FIRE': '..-. .. .-. .',
    'MEDIC': '-- . -.. .. -.-.',
    'WATER': '.-- .- - . .-.',
    'ALLCLEAR': '.- .-.. .-.. -.-. .-.. . .- .-.',
  };

  @override
  Stream<List<Observation>> get onObservationsReceived => _received.stream;

  @override
  Future<void> start() async {
    _running = true;
    // No background radio. Inbound is driven by the host calling
    // onDistressDetected() from its sensors (light/audio/tactile/CW);
    // outbound by beaconIfPriority(). Nothing to bind.
  }

  @override
  Future<void> stop() async {
    _running = false;
    await _received.close();
  }

  /// HONEST NO-OP. canSend is false, so GossipService never calls this. If some
  /// caller does anyway, we do nothing rather than silently pretend — and we
  /// explicitly do NOT try to Morse-encode arbitrary observation data. Use
  /// beaconIfPriority() for the only legitimate outbound path.
  @override
  Future<void> sendObservations(List<Observation> observations) async {
    // intentionally empty — see canSend == false and the class doc.
  }

  // ---- INBOUND: detected distress signal -> synthesized observation ----

  /// The host calls this when ANY sensor decodes a recognized distress code:
  /// a flashlight SOS seen by the camera, a horn pattern heard by the mic, taps
  /// felt by the vibration sensor, CW from the radio. `code` is the decoded
  /// word (e.g. "SOS"); `source` describes the channel ("light","audio",
  /// "tactile","radio") for the observation's vantage.
  ///
  /// Fires the host callback with the synthesized content — unsigned, unchained.
  /// The host signs it via Identity and chains it to lastLocalId, exactly like a
  /// typed report, before it enters the store/flood. Integrity is created at the
  /// bridge device, not transmitted over the light.
  void onDistressDetected(String code, {required String source}) {
    if (!_running) return;
    final upper = code.toUpperCase().replaceAll(' ', '');
    if (!priorityCodes.containsKey(upper)) return; // only recognized codes

    final obs = Observation(
      previousId: 'genesis', // host/gossip will rechain to lastLocalId on author
      pseudonym: 'unknown', // host overwrites with local identity before signing
      timestamp: DateTime.now().toUtc(),
      lat: currentLat(),
      lon: currentLon(),
      property: 'distress',
      value: upper,
      vantageType: 'direct',
      vantageDescription: 'morse:$source',
      inference: 'Distress signal "$upper" detected via $source.',
    );
    _received.add([obs]);
  }

  // ---- OUTBOUND: priority observation -> Morse beacon (explicit path) ----

  /// The ONLY outbound path. Given an observation, emit Morse ONLY if it maps
  /// to a pre-agreed priority code; otherwise do nothing. Never tries to encode
  /// arbitrary data. Returns true if a beacon was emitted.
  ///
  /// Driven explicitly by the host's emergency logic (e.g. "a SOS distress
  /// observation entered the mesh — light the beacon so anyone without a radio
  /// can see it"), NOT by the flood loop.
  Future<bool> beaconIfPriority(Observation obs) async {
    if (!_running) return false;
    if (obs.property != 'distress') return false;
    final morse = priorityCodes[obs.value.toUpperCase()];
    if (morse == null) return false;
    await emitMorse(morse);
    return true;
  }

  /// Direct beacon by code name, for the human-pressed-the-big-red-button case
  /// ("SOS" tapped on the hub). Bypasses observation framing because the human
  /// is signaling NOW; the corresponding observation is authored in parallel
  /// via onDistressDetected on this same device.
  Future<bool> beaconCode(String code) async {
    if (!_running) return false;
    final morse = priorityCodes[code.toUpperCase().replaceAll(' ', '')];
    if (morse == null) return false;
    await emitMorse(morse);
    return true;
  }
}
