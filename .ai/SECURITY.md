# Security Policy for AI Agents

## Hard Constraints

1. **No direct API key access.** API keys are server-side only (`server/api.ts`). Client code must use the `/api/v1/assistant` proxy endpoint.

2. **No autonomous emergency actions.** Actions marked `risk: 'high'` or `requiresAuth: true` in the `EmergencyAction` type require human confirmation. The kill switch, BGP rerouting, and safe mode toggles are human-gated.

3. **Input validation.** All user prompts sent to the AI assistant are:
   - Truncated to 4,000 characters
   - Type-checked (must be string)
   - Sanitized on the server side before inclusion in LLM prompts

4. **No credential storage in code.** The `.env*` pattern is gitignored except `.env.example`. Never commit API keys, tokens, or secrets.

5. **No direct database access.** All data flows through typed service functions. Raw queries are prohibited in component code.

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| API key leakage | Keys server-side only, proxied via Express |
| Prompt injection | Input length limits, server-side sanitization |
| Unauthorized emergency action | `isLocked` state gate + `requiresAuth` flag |
| XSS via AI response | React's built-in escaping, `whitespace-pre-wrap` only |
| Dependency vulnerabilities | Lock file committed, `npm audit` recommended in CI |

## Reporting

If you discover a security issue, open a private issue on the repository or contact the maintainer directly.
