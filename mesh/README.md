# Sovereign Mesh

A decentralized, human-sovereign emergency coordination layer. It lets a
community **self-organize immediately after a disaster** — or pre-plan for
situations no government, city, or agency has covered — using whatever they
have: phones, a Raspberry Pi, a Meshtastic radio, a flashlight. No server. No
admin. No central authority. It keeps coordinating until outside help arrives,
and it never requires anyone to understand the technology underneath to be kept
safe by it.

CC0 1.0 Universal — public domain.

This is the **infrastructure-down** companion to Nexus Emergency Management.
Nexus is the command layer that runs while infrastructure holds (browser, server,
AI providers). This is the layer that keeps working when all of that is gone.
They share an observation schema; they are not the same codebase and run on
different stacks by design.

## The one idea everything rests on

**Identity is content. Nothing else.**

Every report ("the bridge is out", "we have 80 shelter spaces") is an
*observation*. Its identity is a hash of *what it says* — its content-id. This
single decision makes the whole mesh work:

- The same report arriving by ten different routes is recognized as **one**
  report. Deduplication works hardest exactly when the mesh is busiest.
- Altering a report changes its fingerprint and is **detectable**.
- A report can be carried hop-by-hop across dead zones and time gaps and still
  prove it wasn't tampered with.

Authorship (a cryptographic signature) and transit (how many hops it took to
reach you) are layered *on top* and are never part of the identity. This is the
"spine," and it never changed once frozen — every other layer was built on it
without forcing an edit, which is how we know the boundary was right.

## Trust: safety first, security optional

- **Anyone joins in one tap.** Pick a name, you're in. No accounts, no keys to
  understand. This is the disaster default.
- **Every report counts.** A stranger's report is shown and acted on, weighed by
  whether reports *agree*, never silenced for lack of setup.
- **Trust is invisible and optional.** Communities that pre-planned can vouch for
  each other ("I know this person"); trust spreads transitively so it doesn't
  die if the original organizers are out of range, and fades with distance. A
  keypair rides under every node silently — no human is ever shown a key.

See `docs/TRUST_AND_SECURITY.md` for the full deployer-facing explanation,
including five opt-in hardening steps for higher-threat situations.

## Architecture (the layer stack)

```
  OBSERVATIONS (content-addressed, optionally signed)      ← integrity layer
        │  carried by
        ▼
  FOUR TRANSPORTS, two classes:
    observation-class (carry whole content-addressed reports)
      ├ QR / Manual        air-gap; works when every radio is dead
      ├ UDP / LAN          flood-local + seed-discovery on a network
      └ Meshtastic radio   miles of range; chunked + id-verified reassembly
    signal-class (human distress codes, NOT a pipe)
      └ Morse bridge       SOS/HELP/FIRE/… ; detected signal BECOMES a signed
                           report; canSend=false for arbitrary data
        │  orchestrated by
        ▼
  GOSSIP  stamp local transit → learn keys → verify → store (dedup) → flood-if-new
        │  governed by
        ▼
  EPISTEMIC POLICY  community votes its own rules of evidence (trust decay,
                    stranger floor, thresholds). Adoption counted by signed
                    distinct keys × trust weight — Sybil-costly, not free.
        │  kept alive by
        ▼
  POWER MANAGER  crisis / normal / low-power / stationary duty-cycling on solar
```

## File map

```
lib/
  models/
    observation.dart        FROZEN SPINE. id = hash(content). transit + authorship excluded.
  storage/
    observation_store.dart  storage contract; dedup keyed on content-id
    sqlite_store.dart       SQLite impl (Pi/desktop); content-id is PRIMARY KEY
  identity/
    identity.dart           invisible Ed25519 keygen / sign / verify
    trust_graph.dart        transitive vouching, shortest-path-to-organizer, depth decay
  engine/
    policy.dart             epistemic policy: voted trust params, weighted adoption
  mesh/
    mesh_transport.dart     transport contract; canSend honesty rule (no silent no-ops)
    gossip_service.dart     the keystone: receive pipeline + authoring + trust + policy
    manual_qr_transport.dart    #1 air-gap, one observation per code
    udp_lan_transport.dart      #2 flood-local multicast + presence beacons
    meshtastic_transport.dart   #3 long-range, chunk-and-reassemble over the radio
    morse_bridge.dart           #4 signal↔report bridge, deepest fallback
    power_manager.dart      adaptive duty-cycling for multi-day solar runtime
docs/
  TRUST_AND_SECURITY.md     deployer-facing trust model + hardening options
```

## How a node boots (host wiring)

The core package is platform-agnostic; the host app supplies identity storage
and wires each transport's I/O. Sketch:

```dart
// 1. Identity — generated invisibly on first launch, then loaded from a
//    securely-stored 32-byte seed thereafter.
final identity = await Identity.create('House on 5th');   // first run
//   ...later runs: Identity.load(privateSeed: seed, pseudonym: name)

// 2. Storage — Pi/desktop uses SQLite; mobile can back the same interface
//    with sqflite.
final store = SqliteStore('observations.db');
await store.init();

// 3. Trust — who (if anyone) are the pre-planned organizers (depth 0).
//    Empty set = a purely spontaneous mesh; trust simply flattens to floor.
final organizers = <String>{ /* organizer fingerprints, or empty */ };

// 4. Verifier — learns keys from vouches as they arrive.
final verifier = Verifier(<String, List<int>>{});

// 5. Transports — pick what this device has. Each takes injected I/O.
final transports = [
  ManualQrTransport(),
  UdpLanTransport(nodeHandle: identity.fingerprint),
  MeshtasticTransport(sendLine: (line) => radio.sendText(line)),
  // MorseBridge is wired separately (canSend=false; not in the flood loop).
];

// 6. Gossip — the keystone ties it together.
final gossip = GossipService(
  store: store,
  identity: identity,
  verifier: verifier,
  organizers: organizers,
);
await gossip.init(transports);

// 7. Power — react to mode changes by retuning radio duty cycles.
final power = PowerManager();
power.onModeChanged.listen((mode) {
  final duty = PowerManager.dutyCycleFor(mode);
  // host applies `duty` to each radio's scan/advertise scheduling
});

// 8. Morse — distress detected by sensors becomes a SIGNED local report:
final morse = MorseBridge(
  currentLat: () => gps.lat, currentLon: () => gps.lon,
  emitMorse: (m) => led.blink(m),
);
morse.onDistress = (d) => gossip.report(
  property: 'distress', value: d.code, vantageType: 'direct',
  vantageDescription: 'morse:${d.source}', lat: d.lat, lon: d.lon,
);
```

To file a report: `gossip.report(property: 'road_status', value: 'blocked', ...)`
— it is chained, signed, stored, and flooded automatically. The human never
touches a key.

## Status

Built and internally consistent (cross-checked; not yet `pub get`-verified —
confirm dependency versions at a real terminal, network access was unavailable
during construction):

- [x] Spine — `Observation`, content-id identity
- [x] Storage — abstract contract + SQLite, structural dedup
- [x] Identity — invisible Ed25519, sign/verify
- [x] Trust — transitive vouching with depth decay, stranger floor
- [x] Gossip — full receive pipeline; forge vector closed; authoring path
- [x] Transports — QR, UDP/LAN, Meshtastic (chunked), Morse bridge
- [x] Policy — community-voted trust params, Sybil-costly weighted adoption
- [x] Power — adaptive duty-cycling, multi-day solar runtime

Not yet built: optional payload encryption (hardening step 2 in the trust doc),
the platform-specific host apps (mobile UI, the Pi daemon, the field-kit glue),
and a test harness.
