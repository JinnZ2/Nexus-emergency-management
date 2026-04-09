# CLAUDE.md - Project Intelligence

## Project Overview

Nexus Emergency Management is a unified infrastructure monitoring and emergency response platform combining TRDAP (Technical Resource Deployment and Analysis Platform) deployment analysis with Orbital-Phycom physics-informed monitoring. It provides real-time telemetry visualization, ICS-compliant command chain protocols, AI-assisted infrastructure management with multi-provider failover, and a full decision accountability trail.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **UI Library**: shadcn/ui (base-nova style) with base-ui primitives
- **AI Backend**: Multi-provider (Gemini -> Claude -> OpenAI) via server-side Express proxy (`server/api.ts`)
- **Charting**: Recharts
- **Animations**: Motion (framer-motion successor)
- **Path alias**: `@/` maps to `./src/`

## Key Directories

```
src/
  components/       # Page-level components (dashboard panels)
  components/ui/    # shadcn UI primitives (editable - these are the project's copies)
  services/         # API integration layer (gemini.ts calls server proxy)
  lib/              # Utilities, physics constants, data models
  lib/ics/          # ICS command chain, protocols, resources, AI integration
server/             # Express API proxy (keeps API keys server-side)
.ai/                # AI agent configuration, security policy, protocol docs
```

## Critical Rules

1. **NEVER expose API keys in client-side code.** All AI/LLM calls route through `server/api.ts`. The Vite config must NOT use `define` to embed secrets.
2. **Emergency actions require confirmation.** Any action with `requiresAuth: true` must prompt via `ConfirmDialog`. High-risk actions require typed confirmation ("CONFIRM").
3. **AI decisions require documented rationale.** Every approve/reject of an AI proposal must include written reasoning. Blank rationale is rejected. All decisions are logged in `decision-log.ts`.
4. **Physics constants live in `src/lib/constants.ts`.** Ported from JinnZ2/orbital-phycom - keep in sync.
5. **All imports use `@/` alias** which resolves to `src/`. All source files must live under `src/`.

## AI Provider Failover

The server (`server/api.ts`) supports multiple AI providers with automatic failover:

1. **Gemini** (primary) - `GEMINI_API_KEY`
2. **Claude / Anthropic** (failover) - `ANTHROPIC_API_KEY`
3. **OpenAI** (failover) - `OPENAI_API_KEY`
4. **Offline Runbook** (last resort) - keyword-matched emergency procedures, zero network dependency

Each provider has its own circuit breaker. If a provider fails 5 times consecutively, it's skipped for 60s while the next provider in the chain takes over. The client auto-detects provider transitions and displays which provider is active.

Configure one or more API keys in `.env.local`. Only providers with configured keys are active.

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
- **Offline Runbook** (`src/lib/runbook.ts`): 5 pre-computed emergency procedures with triggers, step-by-step instructions, rollback plans, and impact estimates. Works without network/API. Also used as client-side AI fallback when all providers are down.
- **Circuit Breaker** (`server/api.ts`): Per-provider circuit breakers. Open after 5 consecutive failures, auto-reset after 60s with half-open probe.
- **Audit Log** (`src/lib/audit.ts`): Persists to localStorage, survives reloads, capped at 500 entries. Live display in Emergency Management panel.
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

Run `npm run lint` for TypeScript type checking. The project relies on TypeScript strict compilation for compile-time safety.
