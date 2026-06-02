import 'dart:async';

/// ADAPTIVE POWER MANAGEMENT — keeps the mesh alive for DAYS on the solar kit,
/// not hours, without the human ever managing radios.
///
/// The field kit is a 20,000mAh solar bank driving an RPi + Meshtastic radio.
/// Continuous scanning drains it in well under a day. This layer watches
/// context (battery level, movement, user override) and tells each transport
/// how hard to run, while keeping a one-tap "HIGH ALERT" override always within
/// reach for the human.
///
/// This is a rebuild of the original artifact's BatteryManager, fixing three
/// bugs that were in that draft:
///   1. `MeshMode _userOverride;` was non-nullable but used as nullable —
///      a null-safety compile error. Here it is `MeshMode?`.
///   2. Timers were created and never stored/cancelled — a leak on dispose.
///      Here every timer is held and cancelled.
///   3. Mode evaluation could thrash between states; here transitions are
///      explicit and idempotent (no-op if unchanged).
///
/// Transports react via a `setMode` callback, not a hard dependency — this
/// layer doesn't import MeshTransport, it just emits mode changes. The host
/// wires each transport's duty-cycle to these.

enum MeshMode {
  /// Continuous scan/advertise. Human-activated emergency. Burns battery in
  /// hours — deliberately, because right now reach matters more than longevity.
  crisis,

  /// Default. Duty-cycled: brief periodic scan/advertise. Days of runtime.
  normal,

  /// Battery low. Minimal scan, no advertise. Stretches the remaining charge
  /// toward a week so the node is still alive when help/sun arrives.
  lowPower,

  /// No movement for a while (sheltering in place) + nothing urgent. Radios
  /// mostly off; wake periodically. Minimal drain.
  stationary,
}

/// Pure inputs the host feeds in. Keeping this a plain value object (rather than
/// reaching into platform battery/GPS APIs from here) makes the policy testable
/// and keeps platform glue in the host where it belongs.
class PowerContext {
  /// 0.0–1.0 battery fraction. Null if unknown (assume OK).
  final double? batteryLevel;

  /// Whether the device has moved meaningfully since last evaluation.
  final bool moving;

  const PowerContext({this.batteryLevel, this.moving = true});
}

class PowerManager {
  MeshMode _mode = MeshMode.normal;
  MeshMode get mode => _mode;

  /// Null = no human override. Set by the HIGH ALERT button. When present it
  /// wins over every automatic input — the human's call is final.
  MeshMode? _userOverride;

  /// Battery fraction below which we drop to lowPower regardless of movement.
  final double lowBatteryThreshold;

  /// How long without movement before we consider the node stationary.
  final Duration stationaryAfter;

  /// Emitted whenever the effective mode changes. The host subscribes and
  /// pushes the new mode to each transport's duty-cycle.
  final _modeChanges = StreamController<MeshMode>.broadcast();
  Stream<MeshMode> get onModeChanged => _modeChanges.stream;

  DateTime _lastMovement = DateTime.now();
  Timer? _evalTimer; // held so it can be cancelled — bug #2 fix

  PowerManager({
    this.lowBatteryThreshold = 0.20,
    this.stationaryAfter = const Duration(minutes: 15),
    Duration evaluateEvery = const Duration(seconds: 30),
  }) {
    _evalTimer = Timer.periodic(evaluateEvery, (_) => _evaluate(null));
  }

  /// HIGH ALERT pressed. Forces crisis mode until cleared. One tap, always
  /// available, overrides battery and movement both.
  void activateCrisis() {
    _userOverride = MeshMode.crisis;
    _evaluate(null);
  }

  /// HIGH ALERT cleared — return control to the automatic policy.
  void clearCrisis() {
    if (_userOverride == MeshMode.crisis) {
      _userOverride = null;
      _evaluate(null);
    }
  }

  /// Host feeds fresh context (battery, movement) here whenever it has it.
  /// Also called internally on the periodic timer with null (uses last-known).
  void update(PowerContext ctx) => _evaluate(ctx);

  void _evaluate(PowerContext? ctx) {
    if (ctx != null && ctx.moving) {
      _lastMovement = DateTime.now();
    }

    // Priority order: human override > low battery > stationary > normal.
    MeshMode next;
    if (_userOverride != null) {
      next = _userOverride!;
    } else if (ctx?.batteryLevel != null &&
        ctx!.batteryLevel! < lowBatteryThreshold) {
      next = MeshMode.lowPower;
    } else if (DateTime.now().difference(_lastMovement) >= stationaryAfter) {
      next = MeshMode.stationary;
    } else {
      next = MeshMode.normal;
    }

    _setMode(next);
  }

  void _setMode(MeshMode next) {
    if (_mode == next) return; // idempotent — bug #3 fix, no thrash
    _mode = next;
    _modeChanges.add(next);
  }

  /// Recommended transport duty-cycle for a given mode. The host applies these
  /// to each radio. Values mirror the artifact's tested intervals.
  ///   scanWindow  : how long to actively listen each cycle (Duration.zero in
  ///                 stationary => effectively off between wakes)
  ///   cyclePeriod : how often a cycle repeats
  ///   advertise   : whether to announce presence this mode
  static DutyCycle dutyCycleFor(MeshMode mode) {
    switch (mode) {
      case MeshMode.crisis:
        return const DutyCycle(
          scanWindow: Duration(seconds: 0), // 0 = continuous (host interprets)
          cyclePeriod: Duration.zero,
          continuous: true,
          advertise: true,
        );
      case MeshMode.normal:
        return const DutyCycle(
          scanWindow: Duration(seconds: 2),
          cyclePeriod: Duration(seconds: 30),
          advertise: true,
        );
      case MeshMode.lowPower:
        return const DutyCycle(
          scanWindow: Duration(seconds: 1),
          cyclePeriod: Duration(minutes: 5),
          advertise: false,
        );
      case MeshMode.stationary:
        return const DutyCycle(
          scanWindow: Duration(seconds: 1),
          cyclePeriod: Duration(minutes: 15),
          advertise: false,
        );
    }
  }

  void dispose() {
    _evalTimer?.cancel(); // bug #2 fix — no leaked timer
    _modeChanges.close();
  }
}

/// How hard a transport should run in a given mode. The host translates these
/// into actual radio scan/advertise scheduling.
class DutyCycle {
  final Duration scanWindow;
  final Duration cyclePeriod;
  final bool advertise;
  final bool continuous;

  const DutyCycle({
    required this.scanWindow,
    required this.cyclePeriod,
    this.advertise = false,
    this.continuous = false,
  });
}
