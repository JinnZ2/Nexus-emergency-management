# Nexus Emergency Management

A unified infrastructure monitoring and emergency response platform combining **TRDAP** deployment analysis with **Orbital-Phycom** physics-informed monitoring, built on **ICS** (Incident Command System) protocols with **AI partners** in the command chain.

## Stack order

```
offline base  ->  [enhancement, if reachable: any provider]
```

The base is `offline/index.html`: one file, inlined CSS and JS, runbook
content embedded, mirrored as plain text in `offline/RUNBOOK.md`. It opens
from local storage with no network, no server process, no API key, and no
build step. It runs first and always.

Everything else in this repository is connected-mode enhancement layered on
top of the base when conditions allow. The React/Vite/Express application
reads the base layer's runbook at build time; the base layer never calls into
the application. If enhancement is unreachable, nothing retries, nothing
times out in front of the operator, and no banner blocks use.

This is not a fallback chain. See `channels.md` for why, and `DEGRADED.md`
for the test that matters.

## What It Does

Nexus provides a single pane of glass for managing complex infrastructure through eight integrated modules:

| Module | Description |
|--------|-------------|
| **TRDAP Analysis** | Real-time deployment metrics across 16 services in 4 infrastructure layers (edge, compute, storage, core). Tracks latency, CPU, memory, and health status. |
| **Orbital Monitoring** | Physics-informed visualization of infrastructure nodes modeled as an orbital system. Uses real orbital mechanics constants (J2 perturbation, atmospheric drag) ported from the [orbital-phycom](https://github.com/JinnZ2/orbital-phycom) simulation. |
| **Emergency Management** | Kill switches, safe mode, cache flush, and BGP rerouting with locked-by-default safety gates (connected mode only, marked as such in the panel). Confirmation dialog with typed confirmation for high-risk actions. Runbook panel that reads the base layer. Audit log stored in the browser profile, display only, no export. |
| **ICS Command** | Full NIMS/FEMA-compliant Incident Command System: org hierarchy, SOPs for 5 resource domains (comms, power, water, labor, ES) with explicit deviation triggers, resource tracking, escalation matrix, AI partner roles, staging queue, decision log, and training materials. |
| **Agent Protocol** | Machine-readable JSON-LD manifest for AI-to-infrastructure interaction. Defines protocols, endpoints, and safety constraints. |
| **Assistant** | Base layer first: every question is answered from the offline runbook synchronously. If a health probe has shown a provider reachable, one enhancement request (Gemini, Claude, or OpenAI via the server, with per-provider circuit breakers) is layered on top. No polling, no retry loop. |
| **Landslide Honesty Toolkit** | Python and QGIS tools for data-availability assessment and honesty-first landslide susceptibility mapping. Unvalidated outputs are explicitly labeled and fail closed by default. |
| **Floodplain Honesty Toolkit** | Python and QGIS tools for traceable 0.2% annual-chance flood screening. Missing provenance, coverage, metadata, changed-condition review, or qualified technical review closes the publication gate. |

## Architecture

```
BASE (runs first, always)                 ENHANCEMENT (when reachable)
+-------------------------------+         +----------------------------+     +----------------------------+
| offline/index.html            |  read   | Client (React + Vite)      |     | Server (Express)           |
|   runbook (5 procedures)      | <------ | src/components/            |     | server/api.ts              |
|   keyword search              | at      |   TRDAPDashboard           |     |   /api/v1/assistant        |
|   step checklists             | build   |   OrbitalPhycom            |     |   /api/v1/health           |
|   decision record (rationale  |         |   EmergencyManagement      | --> |                            |
|     mandatory)                |         |   ICSCommand               |     | Providers, tried in order: |
|   audit log + text export     |         |   AgentProtocol            |     |   Gemini, Claude, OpenAI   |
|   enhancement-only markers    |         |   AIAssistant (base first) |     | Per-provider circuit       |
| offline/RUNBOOK.md (mirror)   |         |   ErrorBoundary            |     |   breakers                 |
+-------------------------------+         |   ConfirmDialog            |     +----------------------------+
  no network, no server, no key,          +----------------------------+
  no build, no npm                          needs: host on power, local net to it, and for
                                            enhancement: backhaul + provider + key

ICS Library (src/lib/ics/)         Data Libraries (src/lib/)
+----------------------------+     +----------------------------+
| command.ts    (14 roles)   |     | constants.ts (orbital-     |
| protocols.ts  (5 domains)  |     |   phycom physics)          |
| resources.ts  (tracking)   |     | orbital.ts   (mechanics)   |
| escalation.ts (5 levels)   |     | trdap.ts     (infra data)  |
| ai-integration.ts (5 AI)   |     | runbook.ts   (reads base   |
| staging.ts    (queue)      |     |   layer via ?raw import)   |
| decision-log.ts (trail)    |     | audit.ts     (browser      |
| training.ts   (8 modules)  |     |   profile storage)         |
+----------------------------+     +----------------------------+

Hazard Mapping Tools (tools/)
+---------------------------------------------------------+
| Landslide Honesty Toolkit | Floodplain Honesty Toolkit |
+---------------------------------------------------------+
```

## Getting Started

### Base layer (no prerequisites)

Copy `offline/index.html` and `offline/RUNBOOK.md` onto the device that will
be used in the field. Open `index.html` in any browser from local storage.
That is the whole install. Run the procedure in `DEGRADED.md` on that device
and record the result there.

### Connected mode (enhancement)

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (set one or more AI provider keys)
cp .env.example .env.local

# 3. Start the API server (terminal 1)
npm run dev:server

# 4. Start the frontend (terminal 2)
npm run dev:client

# Open http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Start Vite dev server on port 3000 |
| `npm run dev:server` | Start Express API proxy on port 3001 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build artifacts |
| `python3 test_base_layer.py` | Base layer constraints: single file, no network, no npm, markdown mirror in sync, dependency direction |
| `python3 test_channels.py` | Per-failure-mode surviving set; prints the finding |

## Testing order

1. `DEGRADED.md`: the primary test. A person, the target device, networking off, no server, the base layer from local storage, every procedure end to end. Results are a dated table in that file with six-state grades.
2. `python3 test_base_layer.py` and `python3 test_channels.py` (stdlib only).
3. `npm run lint` and `npm run build` for connected mode.
4. Toolkit regression tests, below.

## Landslide Honesty Toolkit

The self-contained [Landslide Honesty Toolkit](tools/landslide-honesty-toolkit/) assesses whether a region has enough local inventory data to support landslide susceptibility mapping. It includes a standalone Python engine, a QGIS Processing algorithm, historical-imagery setup tooling, community guidance, sample reports, and reference maps.

Run a standalone assessment from the repository root:

```bash
python3 tools/landslide-honesty-toolkit/landslide_honesty_engine.py \
  --region "Buncombe County" \
  --state NC \
  --output buncombe-assessment.json
```

Run the toolkit regression tests:

```bash
python3 -m unittest discover \
  -s tools/landslide-honesty-toolkit/tests \
  -p 'test_*.py'
```

> **Safety boundary:** The toolkit produces susceptibility screening information, not site-specific hazard determinations. Keep all `UNVALIDATED` labels intact and obtain licensed geotechnical review before construction or siting decisions.

## Floodplain Honesty Toolkit

The [Floodplain Honesty Toolkit](tools/floodplain-honesty-toolkit/) constructs a traceable emergency-management screening layer for the **0.2% annual-chance flood area**, commonly called the 500-year floodplain. It distinguishes that area from the 1% annual-chance Special Flood Hazard Area, records operator-verified source and coverage evidence, and refuses to publish incomplete or unreviewed boundaries. The toolkit preserves who verified the source but does not independently authenticate operator-entered records.

Run the example assessment from the repository root:

```bash
python3 tools/floodplain-honesty-toolkit/floodplain_honesty_engine.py \
  --input tools/floodplain-honesty-toolkit/assessment_input.example.json \
  --json-output floodplain-report.json \
  --text-output floodplain-report.txt
```

> **Safety boundary:** A screening gate marked open is not a regulatory approval. The toolkit never makes insurance, lending, permitting, code, elevation-certificate, or parcel-level determinations, and areas outside a mapped boundary are not described as having no flood risk.

## Project Structure

```
LICENSE                     # CC0 1.0 Universal
channels.md                 # Channel x failure-mode table; the redundancy finding
DEGRADED.md                 # Degraded-mode procedure and dated results (primary test)
INVESTIGATION.md            # Measured findings: log persistence, autonomous role, scaffold inheritance
test_channels.py            # stdlib: surviving set per failure mode
test_base_layer.py          # stdlib: base layer constraints and markdown mirror sync
offline/
  index.html                # BASE LAYER: single self-contained file, runbook embedded
  RUNBOOK.md                # plain-text mirror of the runbook
.ai/                        # AI agent config, security policy, protocol docs
server/
  api.ts                    # Express proxy — enhancement providers + circuit breakers
tools/
  landslide-honesty-toolkit/  # Landslide data-readiness and susceptibility tools
  floodplain-honesty-toolkit/ # 0.2% annual-chance flood screening tools
src/
  components/
    ui/                     # shadcn/ui primitives
    TRDAPDashboard.tsx      # Deployment metrics dashboard
    OrbitalPhycom.tsx       # Physics-informed orbital visualization
    EmergencyManagement.tsx # Connected-mode triggers, base-layer runbook panel, audit display
    ICSCommand.tsx          # ICS: command chain, protocols, staging queue, decisions
    ConfirmDialog.tsx       # Risk-tiered confirmation modal
    ErrorBoundary.tsx       # React crash recovery with fallback UI
    AgentProtocol.tsx       # JSON-LD manifest viewer
    AIAssistant.tsx         # Base-first assistant; enhancement layered on when reachable
    Sidebar.tsx             # Navigation
  lib/
    ics/                    # ICS command system
      command.ts            # 14 roles, 5 sections, succession order
      protocols.ts          # SOPs for comms, power, water, labor, ES + deviation triggers
      resources.ts          # Resource inventory and tracking
      escalation.ts         # 5 incident levels, 5 deviation rules
      ai-integration.ts     # 5 AI partner roles, handoff protocols
      staging.ts            # AI action staging queue
      decision-log.ts       # Accountability trail (propose -> decide -> outcome)
      training.ts           # 8 training modules for AI partners
    constants.ts            # Physics constants (from orbital-phycom repo)
    orbital.ts              # Orbital mechanics utilities
    trdap.ts                # TRDAP data models and generators
    runbook.ts              # Reads the base layer (offline/index.html) at build time
    audit.ts                # Emergency audit log, browser profile storage, no export
    utils.ts                # Tailwind merge utility
  services/
    gemini.ts               # Base-first assistant service; probe + one enhancement request
  types.ts                  # Shared TypeScript interfaces
  App.tsx                   # Root component with tab routing
  main.tsx                  # React entry point (wrapped in ErrorBoundary)
  vite-env.d.ts             # Vite client types (enables the ?raw import of the base layer)
```

## AI Partner Integration

AI agents are integrated as first-class ICS partners, not just tools:

| AI Role | Reports To | Authority | Purpose |
|---------|-----------|-----------|---------|
| Operations Monitor | Ops Chief | Recommend | Anomaly detection, failure prediction |
| Planning Analyst | Planning Chief | Assist | Draft IAPs, scenario modeling |
| Logistics Optimizer | Logistics Chief | Recommend | Resource allocation, supply tracking |
| Comms Coordinator | Comms Lead | Autonomous | Channel monitoring, auto-failover |
| Safety Sentinel | Safety Officer | Recommend | Environmental monitoring, fatigue tracking |

**Staging Queue**: AI partners propose actions that queue for human review. Humans must provide written rationale when approving or rejecting — no blank decisions.

**Decision Log**: Records what AI proposed, what human decided (with required rationale and response time), and what actually happened. Stored in the browser profile; exportable as JSON. Measured status of the staging-to-log path is in `INVESTIGATION.md` E1.

**Training Materials**: 8 structured modules covering ICS fundamentals, domain briefings, decision frameworks, handoff procedures, and degraded operations.

## Connected Repositories

- **[orbital-phycom](https://github.com/JinnZ2/orbital-phycom)** — Python orbital mechanics simulation. Physics constants and PHYCOM protocol specs ported to `src/lib/constants.ts` and `src/lib/orbital.ts`.
- **[Infrastructure-assistance](https://github.com/JinnZ2/Infrastructure-assistance)** — Next.js infrastructure resilience app. TRDAP data models and service topology inform `src/lib/trdap.ts`.

## Security

- API keys are **server-side only** (never embedded in the client bundle)
- Emergency actions are **locked by default** and require explicit unlock
- High-risk actions require typed "CONFIRM" confirmation
- AI proposals require **mandatory human review with written rationale**
- Decision log and audit log are stored in the browser profile of the device that wrote them (see `INVESTIGATION.md` E1 for survival conditions and export paths)
- AI prompts are length-limited and sanitized before LLM submission
- Error boundary prevents UI crash from blocking backend operations
- See [`.ai/SECURITY.md`](.ai/SECURITY.md) for the full security policy

## Channel independence

Against connectivity loss, the three API providers are ONE channel.

Under no power, no local net, or no backhaul, Gemini, Claude, and OpenAI
fail at the same instant from the same cause. Per-provider circuit breakers
remain in `server/api.ts` and they are useful for exactly three failure
modes: one vendor down, one key or account problem, one vendor rate
limiting. For those modes the providers are redundant with each other. For
connectivity loss they are not, and no arrangement of them can be.

The only channel that survives every failure mode in `channels.md` is the
offline base. `python3 test_channels.py` prints the surviving set per mode.

## Tech Stack

- **React 19** + **TypeScript 5.8**
- **Vite 6** (build + dev server + proxy)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **shadcn/ui** (base-nova style, base-ui primitives)
- **Recharts** (data visualization)
- **Motion** (animations)
- **Express** (API proxy for enhancement providers, with circuit breakers)
- **Gemini / Claude / OpenAI** (enhancement, tried in order, one channel against connectivity loss)
- **Base layer**: HTML + CSS + JS in one file, no dependencies
- **Python 3.9+ / QGIS 3.28+** (honesty-first landslide and floodplain mapping tools)

## License

CC0 1.0 Universal. No rights reserved. Full text in `LICENSE`.

Two subfolders merged separately carry their own MIT `LICENSE` files as they
arrived: `tools/landslide-honesty-toolkit/` and
`tools/floodplain-honesty-toolkit/`. See `INVESTIGATION.md`.
