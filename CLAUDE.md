# CLAUDE.md - Project Intelligence

## Project Overview

Nexus Emergency Management is a unified infrastructure monitoring and emergency response platform combining TRDAP (Technical Resource Deployment and Analysis Platform) deployment analysis with Orbital-Phycom physics-informed monitoring. It provides real-time telemetry visualization, ICS-compliant command chain protocols, AI-assisted infrastructure management with multi-provider failover, and a full decision accountability trail.

## Stack order

```
offline base (offline/index.html + offline/RUNBOOK.md)  ->  [enhancement, if reachable]
```

The base layer is a single self-contained HTML file. No network, no server, no key, no build, no npm. It runs first and always. The React/Vite/Express app is connected-mode enhancement: it reads the base layer's runbook at build time (`src/lib/runbook.ts` imports `offline/index.html?raw`); the base layer never references the app. `test_base_layer.py` enforces both.

## Architecture

- **Base layer**: `offline/index.html` (inlined CSS/JS, runbook embedded as JSON) + `offline/RUNBOOK.md` (plain-text mirror)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **UI Library**: shadcn/ui (base-nova style) with base-ui primitives
- **AI Backend (enhancement)**: Gemini, Claude, OpenAI tried in order via server-side Express proxy (`server/api.ts`). One channel against connectivity loss; see `channels.md`.
- **Charting**: Recharts
- **Animations**: Motion (framer-motion successor)
- **Path alias**: `@/` maps to `./src/`

## Key Directories

```
offline/          # BASE LAYER. Edit index.html and RUNBOOK.md together.
src/
  components/       # Page-level components (dashboard panels)
  components/ui/    # shadcn UI primitives (editable - these are the project's copies)
  services/         # API integration layer (gemini.ts calls server proxy)
  lib/              # Utilities, physics constants, data models
  lib/ics/          # ICS command chain, protocols, resources, AI integration
server/             # Express API proxy (keeps API keys server-side)
.ai/                # AI agent configuration, security policy, protocol docs
tools/              # Standalone honesty-first hazard mapping toolkits
```

## Critical Rules

1. **NEVER expose API keys in client-side code.** All AI/LLM calls route through `server/api.ts`. The Vite config must NOT use `define` to embed secrets.
2. **Emergency actions require confirmation.** Any action with `requiresAuth: true` must prompt via `ConfirmDialog`. High-risk actions require typed confirmation ("CONFIRM").
3. **AI decisions require documented rationale.** Every approve/reject of an AI proposal must include written reasoning. Blank rationale is rejected. All decisions are logged in `decision-log.ts`.
4. **Physics constants live in `src/lib/constants.ts`.** Ported from JinnZ2/orbital-phycom - keep in sync.
5. **Frontend imports use the `@/` alias** which resolves to `src/`. All React and TypeScript application source files must live under `src/`; standalone hazard tooling lives under `tools/`.
6. **Hazard screening fails closed.** The landslide and floodplain tools must preserve required warnings, distinguish no data from low risk, and never make parcel-level or regulatory determinations.
7. **The base layer stays base.** `offline/index.html` must not gain a network call, an external resource, a module import, a service worker, or a reference to the app. Runbook edits go in `offline/index.html` (JSON block) and `offline/RUNBOOK.md` together, and bump `revision`. Scripts outside the React app are Python 3 stdlib only.
8. **Enhancement-only functions are marked at the point of use**, in the UI, not only in docs. Anything the system claims to do in an emergency is either in the base layer or carries the marker.

## Enhancement Providers

The assistant answers from the base layer first, synchronously (`baseLayerResponse` in `src/services/gemini.ts`). Enhancement is attempted only if a 3-second health probe has succeeded (on mount, on the browser `online` event, or on operator request; no interval). One request, 20-second abort, no retry, no blocking banner.

The server (`server/api.ts`) tries providers in order, on top of the base result:

1. **Gemini** - `GEMINI_API_KEY`
2. **Claude / Anthropic** - `ANTHROPIC_API_KEY`
3. **OpenAI** - `OPENAI_API_KEY`

Each provider has its own circuit breaker (open after 5 consecutive failures, 60s reset with half-open probe). The breakers are redundancy against one vendor's outage, key problem, or rate limit. They are not redundancy against connectivity loss: under no power, no local net, or no backhaul all three fail together (`channels.md`, `test_channels.py`).

Configure keys in `.env.local`. Only providers with configured keys are active.

## ICS Command System (`src/lib/ics/`)

NIMS/FEMA-compliant Incident Command System implementation:

- **`command.ts`**: 14 roles across 5 sections (Command, Operations, Planning, Logistics, Finance/Admin) with responsibilities, authority, span of control, and succession order.
- **`protocols.ts`**: Standard operating procedures for 5 resource domains (Communication, Electricity, Water, Labor, Emergency Services). Each has ordered steps with time limits and explicit deviation triggers — conditions where standard protocol is insufficient.
- **`resources.ts`**: Resource inventory tracking (available/assigned/out-of-service) across all domains.
- **`escalation.ts`**: 5 incident levels (Monitoring -> Catastrophic) and 5 deviation rules for when to break chain of command.
- **`ai-integration.ts`**: 5 AI partner roles mapped into ICS hierarchy with capabilities, limitations, handoff triggers, and 4 handoff protocols (escalation, delegation, shift continuity, emergency override).
- **`staging.ts`**: Action staging queue where AI proposes and humans review. Rationale is mandatory. Auto-logs to decision trail.
- **`training.ts`**: 8 structured training modules for AI partners (ICS fundamentals, domain briefings, decision frameworks, handoff procedures, degraded operations).
- **`decision-log.ts`**: Full accountability chain — what AI proposed, what human decided (with required rationale), what actually happened. Exportable as JSON for post-incident review. Capped at 1000 records.

## Edge-Case Emergency Systems

- **Error Boundary** (`src/components/ErrorBoundary.tsx`): Wraps the entire app in `main.tsx`. On crash, shows fallback UI explaining that backend services are still operational and provides a reload button.
- **Confirmation Dialog** (`src/components/ConfirmDialog.tsx`): Modal with risk-tier styling. High-risk actions require typing "CONFIRM". Wired into `EmergencyManagement.tsx`.
- **Base Layer** (`offline/index.html`, `offline/RUNBOOK.md`): 5 emergency procedures with triggers, step checklists, rollback, impact; keyword search; decision record with mandatory rationale; audit log with text/clipboard/download/print export; enhancement-only markers. `src/lib/runbook.ts` reads it.
- **Circuit Breaker** (`server/api.ts`): Per-provider circuit breakers. Open after 5 consecutive failures, auto-reset after 60s with half-open probe.
- **Audit Log** (`src/lib/audit.ts`): localStorage of one browser profile, survives reloads, capped at 500 entries, no export path. Live display in Emergency Management panel. See `INVESTIGATION.md` E1 for measured persistence of this and the decision log.
- **Health Check**: `GET /api/v1/health` returns uptime, per-provider status (configured + circuit state), and active provider list.

## Development

```bash
npm install            # Install dependencies
npm run dev:client     # Start Vite dev server on :3000
npm run dev:server     # Start API proxy on :3001
npm run build          # Production build
npm run lint           # TypeScript type checking
```

The Vite dev server proxies `/api/*` requests to the Express server on port 3001.

## Connected Repositories

- **orbital-phycom** (JinnZ2/orbital-phycom) - Python orbital mechanics simulation. Physics constants and protocol specs ported to `src/lib/constants.ts` and `src/lib/orbital.ts`.
- **Infrastructure-assistance** (JinnZ2/Infrastructure-assistance) - Next.js infrastructure resilience app. TRDAP concepts and data models inform `src/lib/trdap.ts`.

## Naming Conventions

- Components: PascalCase (`TRDAPDashboard.tsx`)
- Services/libs: camelCase (`gemini.ts`, `orbital.ts`)
- Types: PascalCase interfaces in `src/types.ts`
- CSS: Tailwind utility classes, dark mode via `.dark` class on root

## Testing

Primary test: `DEGRADED.md`. A person, the target device, networking off, no server, the base layer from local storage, every procedure end to end, graded with six states, results dated in that file. Re-run after any base layer change.

```bash
python3 test_base_layer.py   # base layer constraints + RUNBOOK.md mirror sync
python3 test_channels.py     # surviving set per failure mode (prints the finding)
npm run lint                 # TypeScript
npm run build                # verifies the ?raw import of the base layer
```

Run the standalone hazard-toolkit regression tests with:

```bash
python3 -m unittest discover -s tools/landslide-honesty-toolkit/tests -p 'test_*.py'
python3 -m unittest discover -s tools/floodplain-honesty-toolkit/tests -p 'test_*.py'
```
