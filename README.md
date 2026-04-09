# Nexus Emergency Management

A unified infrastructure monitoring and emergency response platform combining **TRDAP** deployment analysis with **Orbital-Phycom** physics-informed monitoring.

## What It Does

Nexus provides a single pane of glass for managing complex infrastructure through five integrated modules:

| Module | Description |
|--------|-------------|
| **TRDAP Analysis** | Real-time deployment metrics across 16 services in 4 infrastructure layers (edge, compute, storage, core). Tracks latency, CPU, memory, and health status. |
| **Orbital Monitoring** | Physics-informed visualization of infrastructure nodes modeled as an orbital system. Uses real orbital mechanics constants (J2 perturbation, atmospheric drag) ported from the [orbital-phycom](https://github.com/JinnZ2/orbital-phycom) simulation. |
| **Emergency Management** | Kill switches, safe mode, cache flush, and BGP rerouting with locked-by-default safety gates. High-risk actions require explicit unlock. |
| **Agent Protocol** | Machine-readable JSON-LD manifest for AI-to-infrastructure interaction. Defines protocols, endpoints, and safety constraints. |
| **AI Assistant** | Gemini-powered conversational interface for infrastructure queries. Runs through a server-side proxy to keep API keys secure. |

## Architecture

```
Client (React + Vite)          Server (Express)
+-----------------------+      +-------------------+
| src/components/       |      | server/api.ts     |
|   TRDAPDashboard      |      |   /api/v1/assistant
|   OrbitalPhycom       | ---> |   (Gemini proxy)  |
|   EmergencyManagement |      +-------------------+
|   AgentProtocol       |
|   AIAssistant         |      Data Libraries
+-----------------------+      +-------------------+
| src/lib/              |      | constants.ts      |
|   orbital.ts          |      |   (from orbital-  |
|   trdap.ts            |      |    phycom)        |
+-----------------------+      +-------------------+
```

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and set your GEMINI_API_KEY

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

## Project Structure

```
.ai/                    # AI agent config, security policy, protocol docs
server/
  api.ts                # Express proxy - keeps API keys server-side
src/
  components/
    ui/                 # shadcn/ui primitives
    TRDAPDashboard.tsx  # Deployment metrics dashboard
    OrbitalPhycom.tsx   # Physics-informed orbital visualization
    EmergencyManagement.tsx  # Kill switches and safety protocols
    AgentProtocol.tsx   # JSON-LD manifest viewer
    AIAssistant.tsx     # Chat interface to Gemini
    Sidebar.tsx         # Navigation
  lib/
    constants.ts        # Physics constants (from orbital-phycom repo)
    orbital.ts          # Orbital mechanics utilities
    trdap.ts            # TRDAP data models and generators
    utils.ts            # Tailwind merge utility
  services/
    gemini.ts           # AI assistant API client
  types.ts              # Shared TypeScript interfaces
  App.tsx               # Root component with tab routing
  main.tsx              # React entry point
```

## Connected Repositories

This platform integrates concepts and data from two sibling repositories:

- **[orbital-phycom](https://github.com/JinnZ2/orbital-phycom)** - Python orbital mechanics simulation. Physics constants and PHYCOM protocol specs are ported to `src/lib/constants.ts` and `src/lib/orbital.ts`.
- **[Infrastructure-assistance](https://github.com/JinnZ2/Infrastructure-assistance)** - Next.js infrastructure resilience app. TRDAP data models and service topology inform `src/lib/trdap.ts`.

## Security

- API keys are **server-side only** (never embedded in the client bundle)
- Emergency actions are **locked by default** and require explicit unlock
- High-risk actions (kill switch, BGP reroute) require `requiresAuth: true`
- AI prompts are length-limited and sanitized before LLM submission
- See [`.ai/SECURITY.md`](.ai/SECURITY.md) for the full security policy

## Tech Stack

- **React 19** + **TypeScript 5.8**
- **Vite 6** (build + dev server + proxy)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **shadcn/ui** (base-nova style, base-ui primitives)
- **Recharts** (data visualization)
- **Motion** (animations)
- **Express** (API proxy)
- **Gemini API** via `@google/genai`

## License

See repository for license details.
