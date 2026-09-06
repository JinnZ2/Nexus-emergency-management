# Nexus Emergency Management

A unified infrastructure monitoring and emergency response platform combining **TRDAP** deployment analysis with **Orbital-Phycom** physics-informed monitoring, built on **ICS** (Incident Command System) protocols with **AI partners** in the command chain.

## What It Does

Nexus provides a single pane of glass for managing complex infrastructure through seven integrated modules:

| Module | Description |
|--------|-------------|
| **TRDAP Analysis** | Real-time deployment metrics across 16 services in 4 infrastructure layers (edge, compute, storage, core). Tracks latency, CPU, memory, and health status. |
| **Orbital Monitoring** | Physics-informed visualization of infrastructure nodes modeled as an orbital system. Uses real orbital mechanics constants (J2 perturbation, atmospheric drag) ported from the [orbital-phycom](https://github.com/JinnZ2/orbital-phycom) simulation. |
| **Emergency Management** | Kill switches, safe mode, cache flush, and BGP rerouting with locked-by-default safety gates. Confirmation dialog with typed confirmation for high-risk actions. Offline runbook. Persistent audit log. |
| **ICS Command** | Full NIMS/FEMA-compliant Incident Command System: org hierarchy, SOPs for 5 resource domains (comms, power, water, labor, ES) with explicit deviation triggers, resource tracking, escalation matrix, AI partner roles, staging queue, decision log, and training materials. |
| **Agent Protocol** | Machine-readable JSON-LD manifest for AI-to-infrastructure interaction. Defines protocols, endpoints, and safety constraints. |
| **AI Assistant** | Multi-provider AI assistant (Gemini -> Claude -> OpenAI -> offline runbook) with automatic failover, per-provider circuit breakers, and provider transition announcements. |
| **Landslide Honesty Toolkit** | Python and QGIS tools for data-availability assessment and honesty-first landslide susceptibility mapping. Unvalidated outputs are explicitly labeled and fail closed by default. |

## Architecture

```
Client (React + Vite)              Server (Express)
+----------------------------+     +----------------------------+
| src/components/            |     | server/api.ts              |
|   TRDAPDashboard           |     |   /api/v1/assistant        |
|   OrbitalPhycom            |     |   /api/v1/health           |
|   EmergencyManagement      |     |                            |
|   ICSCommand               | --> | Providers:                 |
|   AgentProtocol            |     |   Gemini -> Claude ->      |
|   AIAssistant              |     |   OpenAI -> offline        |
|   ErrorBoundary            |     | Per-provider circuit       |
|   ConfirmDialog            |     |   breakers                 |
+----------------------------+     +----------------------------+

ICS Library (src/lib/ics/)         Data Libraries (src/lib/)
+----------------------------+     +----------------------------+
| command.ts    (14 roles)   |     | constants.ts (orbital-     |
| protocols.ts  (5 domains)  |     |   phycom physics)          |
| resources.ts  (tracking)   |     | orbital.ts   (mechanics)   |
| escalation.ts (5 levels)   |     | trdap.ts     (infra data)  |
| ai-integration.ts (5 AI)   |     | runbook.ts   (offline)     |
| staging.ts    (queue)      |     | audit.ts     (emergency)   |
| decision-log.ts (trail)    |     +----------------------------+
| training.ts   (8 modules)  |
+----------------------------+

Hazard Mapping Tools (tools/landslide-honesty-toolkit/)
+------------------------------------------------------+
| Honesty Engine | QGIS algorithm | Community guides  |
+------------------------------------------------------+
```

## Getting Started

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

## Project Structure

```
.ai/                        # AI agent config, security policy, protocol docs
server/
  api.ts                    # Express proxy — multi-provider failover + circuit breakers
tools/
  landslide-honesty-toolkit/ # Python/QGIS honesty-first hazard mapping toolkit
src/
  components/
    ui/                     # shadcn/ui primitives
    TRDAPDashboard.tsx      # Deployment metrics dashboard
    OrbitalPhycom.tsx       # Physics-informed orbital visualization
    EmergencyManagement.tsx # Kill switches, safety protocols, audit log
    ICSCommand.tsx          # ICS: command chain, protocols, staging queue, decisions
    ConfirmDialog.tsx       # Risk-tiered confirmation modal
    ErrorBoundary.tsx       # React crash recovery with fallback UI
    AgentProtocol.tsx       # JSON-LD manifest viewer
    AIAssistant.tsx         # Multi-provider AI chat with offline fallback
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
    runbook.ts              # 5 offline emergency procedures
    audit.ts                # Persistent emergency audit log
    utils.ts                # Tailwind merge utility
  services/
    gemini.ts               # Multi-provider AI client with offline fallback
  types.ts                  # Shared TypeScript interfaces
  App.tsx                   # Root component with tab routing
  main.tsx                  # React entry point (wrapped in ErrorBoundary)
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

**Decision Log**: Full accountability trail recording what AI proposed, what human decided (with required rationale and response time), and what actually happened. Exportable as JSON for post-incident review.

**Training Materials**: 8 structured modules covering ICS fundamentals, domain briefings, decision frameworks, handoff procedures, and degraded operations.

## Connected Repositories

- **[orbital-phycom](https://github.com/JinnZ2/orbital-phycom)** — Python orbital mechanics simulation. Physics constants and PHYCOM protocol specs ported to `src/lib/constants.ts` and `src/lib/orbital.ts`.
- **[Infrastructure-assistance](https://github.com/JinnZ2/Infrastructure-assistance)** — Next.js infrastructure resilience app. TRDAP data models and service topology inform `src/lib/trdap.ts`.

## Security

- API keys are **server-side only** (never embedded in the client bundle)
- Multi-provider failover with per-provider circuit breakers
- Emergency actions are **locked by default** and require explicit unlock
- High-risk actions require typed "CONFIRM" confirmation
- AI proposals require **mandatory human review with written rationale**
- Decision accountability log creates permanent record of AI/human decisions
- AI prompts are length-limited and sanitized before LLM submission
- Error boundary prevents UI crash from blocking backend operations
- See [`.ai/SECURITY.md`](.ai/SECURITY.md) for the full security policy

## Tech Stack

- **React 19** + **TypeScript 5.8**
- **Vite 6** (build + dev server + proxy)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **shadcn/ui** (base-nova style, base-ui primitives)
- **Recharts** (data visualization)
- **Motion** (animations)
- **Express** (API proxy with multi-provider failover)
- **Gemini / Claude / OpenAI** (automatic failover chain)
- **Python 3.9+ / QGIS 3.28+** (landslide data-readiness and susceptibility tools)

## License

See repository for license details.
