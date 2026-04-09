# .ai/ - AI Agent Configuration

This directory contains configuration and documentation for AI agents interacting with the Nexus Emergency Management platform.

## Contents

| File | Purpose |
|------|---------|
| `SECURITY.md` | Security policy - what agents must and must not do |
| `AGENT_PROTOCOL.md` | Machine-readable interaction protocol and API surface |
| `config.json` | Structured agent configuration (capabilities, constraints) |

## Quick Start for AI Agents

1. Read `SECURITY.md` first - it defines hard constraints.
2. Parse `config.json` for structured capabilities and endpoints.
3. Reference `AGENT_PROTOCOL.md` for interaction patterns.

## Entry Point

If you are an AI agent or LLM interacting with this codebase:

- Main application entry: `src/main.tsx`
- AI service layer: `src/services/gemini.ts` (calls server proxy, NOT direct API)
- Types: `src/types.ts`
- Physics constants (from orbital-phycom): `src/lib/constants.ts`
- Orbital mechanics utilities: `src/lib/orbital.ts`
- TRDAP data models: `src/lib/trdap.ts`
- Server-side API proxy: `server/api.ts`

## Safety

All emergency actions (`EmergencyAction` type) with `requiresAuth: true` require explicit human confirmation. AI agents must NEVER execute high-risk actions autonomously.
