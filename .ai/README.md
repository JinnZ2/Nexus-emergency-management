# .ai/ - AI Agent Configuration

This directory contains configuration and documentation for AI agents interacting with the Nexus Emergency Management platform.

## Contents

| File | Purpose |
|------|---------|
| `SECURITY.md` | Security policy - what agents must and must not do |
| `AGENT_PROTOCOL.md` | Interaction protocol, ICS roles, staging queue rules |
| `config.json` | Structured agent configuration (capabilities, constraints, ICS) |

## Quick Start for AI Agents

1. Read `SECURITY.md` first - it defines hard constraints.
2. Parse `config.json` for structured capabilities, ICS roles, and endpoints.
3. Reference `AGENT_PROTOCOL.md` for interaction patterns and staging queue rules.
4. Review your training materials: `src/lib/ics/training.ts` has 8 modules.

## Entry Points

| File | Purpose |
|------|---------|
| `offline/index.html` | BASE LAYER. Runbook, search, decision record, audit log. No network, no server, no key, no build. |
| `offline/RUNBOOK.md` | Plain-text mirror of the runbook |
| `src/main.tsx` | Connected-mode application entry (wrapped in ErrorBoundary) |
| `src/services/gemini.ts` | Assistant service — base layer first, one enhancement request if reachable |
| `src/types.ts` | Shared TypeScript interfaces |
| `src/lib/constants.ts` | Physics constants (from orbital-phycom) |
| `src/lib/orbital.ts` | Orbital mechanics utilities |
| `src/lib/trdap.ts` | TRDAP data models |
| `src/lib/runbook.ts` | Reads the base layer runbook at build time |
| `src/lib/audit.ts` | Emergency audit log (browser profile storage, no export) |
| `server/api.ts` | Server-side API proxy for enhancement providers |

## ICS Integration

AI agents are integrated as ICS partners in `src/lib/ics/`:

| File | Purpose |
|------|---------|
| `ai-integration.ts` | 5 AI partner roles, authority levels, handoff protocols |
| `staging.ts` | Action staging queue - propose here, humans review |
| `decision-log.ts` | Accountability trail - browser profile storage; measured state in `INVESTIGATION.md` E1 |
| `training.ts` | 8 training modules - read these to understand your role |
| `command.ts` | ICS org hierarchy - know who you report to |
| `protocols.ts` | Domain SOPs and deviation triggers |
| `resources.ts` | Resource inventory and tracking |
| `escalation.ts` | Incident levels and deviation rules |

## Critical Rules

1. All emergency actions with `requiresAuth: true` require explicit human confirmation. AI agents must NEVER execute high-risk actions autonomously.
2. All AI recommendations go through the **staging queue**. Propose, don't act.
3. When humans decide on your proposals, they must document rationale. You must log the full chain in the **decision log**.
4. When your confidence drops below 60%, escalate to your ICS supervisor with options, not recommendations.
5. Life-safety decisions are ALWAYS human. No exceptions.
