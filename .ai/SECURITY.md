# Security Policy for AI Agents

## Hard Constraints

1. **No direct API key access.** API keys are server-side only (`server/api.ts`). Client code must use the `/api/v1/assistant` proxy endpoint. Multiple providers are supported with automatic failover.

2. **No autonomous emergency actions.** Actions marked `risk: 'high'` or `requiresAuth: true` in the `EmergencyAction` type require human confirmation. The kill switch, BGP rerouting, and safe mode toggles are human-gated. High-risk actions require typed "CONFIRM".

3. **Mandatory decision rationale.** When reviewing AI proposals in the staging queue, humans must provide written reasoning. The system rejects blank rationale. This creates an accountability trail in `decision-log.ts`.

4. **Input validation.** All user prompts sent to the AI assistant are:
   - Truncated to 4,000 characters
   - Type-checked (must be string)
   - Sanitized on the server side before inclusion in LLM prompts

5. **No credential storage in code.** The `.env*` pattern is gitignored except `.env.example`. Never commit API keys, tokens, or secrets.

6. **No direct database access.** All data flows through typed service functions. Raw queries are prohibited in component code.

7. **AI authority boundaries.** AI partner roles have defined authority levels (`autonomous`, `recommend`, `assist`, `observe`). AI cannot self-promote authority. Life-safety decisions are always human.

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| API key leakage | Keys server-side only, multi-provider proxy |
| Prompt injection | Input length limits, server-side sanitization |
| Unauthorized emergency action | `isLocked` gate + `requiresAuth` + typed confirmation |
| AI acting beyond authority | Authority levels enforced, staging queue human-gated |
| Unaccountable decisions | Decision log with mandatory rationale, exportable JSON |
| Single provider failure (one vendor down, one key, one rate limit) | Per-provider circuit breakers; the other vendors take the enhancement request |
| Connectivity loss (no power, no local net, no backhaul) | The base layer (`offline/index.html`) runs first and always. The three providers are one channel here; see `channels.md`. |
| UI crash during emergency | ErrorBoundary with fallback UI, backend stays operational |
| XSS via AI response | React's built-in escaping, `whitespace-pre-wrap` only |
| Dependency vulnerabilities | Lock file committed, `npm audit` recommended in CI |

## Decision Accountability

The decision log (`src/lib/ics/decision-log.ts`) records, in the localStorage of the browser profile that wrote it (survival conditions and the measured state of the write path are in `INVESTIGATION.md` E1):

- **What AI proposed**: title, description, rationale, confidence, risk, timestamp
- **What human decided**: approve/reject, written rationale (mandatory), response time, who decided
- **What actually happened**: outcome recorded retrospectively (ai_correct, ai_incorrect, inconclusive)

This log is exportable as JSON for post-incident review, legal compliance, and organizational learning.

## Reporting

If you discover a security issue, open a private issue on the repository or contact the maintainer directly.
