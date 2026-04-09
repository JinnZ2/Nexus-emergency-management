# CLAUDE.md - Project Intelligence

## Project Overview

Nexus Emergency Management is a unified infrastructure monitoring and emergency response platform combining TRDAP (Technical Resource Deployment and Analysis Platform) deployment analysis with Orbital-Phycom physics-informed monitoring. It provides real-time telemetry visualization, emergency intervention protocols, and AI-assisted infrastructure management.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **UI Library**: shadcn/ui (base-nova style) with base-ui primitives
- **AI Backend**: Gemini API via server-side Express proxy (`server/api.ts`)
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
server/             # Express API proxy (keeps API keys server-side)
.ai/                # AI agent configuration, security policy, protocol docs
```

## Critical Rules

1. **NEVER expose API keys in client-side code.** All AI/LLM calls route through `server/api.ts`. The Vite config must NOT use `define` to embed secrets.
2. **Emergency actions require confirmation.** Any action with `requiresAuth: true` must prompt via `ConfirmDialog`. High-risk actions require typed confirmation ("CONFIRM").
3. **Physics constants live in `src/lib/constants.ts`.** Ported from JinnZ2/orbital-phycom - keep in sync.
4. **All imports use `@/` alias** which resolves to `src/`. All source files must live under `src/`.

## Edge-Case Emergency Systems

- **Error Boundary** (`src/components/ErrorBoundary.tsx`): Wraps the entire app in `main.tsx`. On crash, shows fallback UI explaining that backend services are still operational and provides a reload button.
- **Confirmation Dialog** (`src/components/ConfirmDialog.tsx`): Modal with risk-tier styling. High-risk actions require typing "CONFIRM". Wired into `EmergencyManagement.tsx`.
- **Offline Runbook** (`src/lib/runbook.ts`): 5 pre-computed emergency procedures with triggers, step-by-step instructions, rollback plans, and impact estimates. Works without network/API.
- **Circuit Breaker** (`server/api.ts`): Opens after 5 consecutive Gemini failures, returns 503 with "use runbook" message. Auto-resets after 60s with a half-open probe.
- **Audit Log** (`src/lib/audit.ts`): Persists to localStorage, survives reloads, capped at 500 entries. Live display in Emergency Management panel.
- **Health Check**: `GET /api/v1/health` returns uptime, Gemini config status, and circuit breaker state.

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
