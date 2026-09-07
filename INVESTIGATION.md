# Investigation findings

Dated 2026-09-06. Measured, not fixed. Each item names what was measured,
how, and what the measurement showed. Recommendations are deliberately absent
except where the work order asked for a scope change to a claim.

Method key:
- `code` = read from source at the commit this file was added
- `bundle` = grepped from the production bundle produced by `npm run build`
- `runtime` = driven in headless Chromium against `vite preview` of that bundle

---

## E1. Audit log and decision log persistence

### Where each one persists

| store | key | cap | write path | read path | export path |
|---|---|---|---|---|---|
| `src/lib/audit.ts` | `localStorage["nexus_audit_log"]` | 500 entries, oldest dropped | `logAudit()` | `getAuditLog()` | none. No function, no button. Display only (last 20 entries) in `EmergencyManagement.tsx`. |
| `src/lib/ics/decision-log.ts` | `localStorage["nexus_decision_log"]` | 1000 records, oldest dropped | `logDecision()`, `recordOutcome()` | `getDecisionLog()` | `exportDecisionLog()` -> JSON string -> Blob -> anchor download in `ICSCommand.tsx`. Works with no network. Needs a browser that allows downloads and a session that still holds the data. |
| `src/lib/ics/staging.ts` | `localStorage["nexus_staging_queue"]` | 200 | `stageAction()`, `reviewAction()` | `getStagedActions()` | none |
| `server/api.ts` | nothing | - | - | - | The server persists nothing. No file, no database. Circuit-breaker state is process memory. |

Method: `code`.

### Survival conditions (browser localStorage, all three stores)

Survives: page reload, tab close and reopen, browser restart, on the same
device, same browser, same profile, same origin.

Does not survive: a different device; a different browser on the same device;
a different profile; "clear site data" or history clearing that includes site
data; a private or incognito window closing; a change of origin (the dev
server at `localhost:3000`, a production host, and a `file://` copy are
three separate stores that never see each other); storage quota exceeded
(the write is caught and dropped silently, the entry is lost, and a console
warning is the only trace); cap truncation (entry 501 or record 1001 pushes
the oldest out, silently).

Method: `code` (the try/catch around every `setItem`, the `MAX_*` constants,
the storage keys) plus browser storage semantics.

### Measured behaviour of the accountability chain

`staging.ts` writes to the decision log through:

```
const { logDecision } = require('./decision-log');
```

inside a try/catch. The production bundle carries that call verbatim
(`bundle`: one occurrence of `require("./decision-log")` in
`dist/assets/index-*.js`). In a browser ES-module bundle `require` is not
defined. The `ReferenceError` is swallowed by the surrounding catch.

Runtime check (`runtime`): opened the built app, ICS Command, Staging Queue,
reviewed the first pending action with a written rationale, approved it.

| observation | value |
|---|---|
| page errors | none (the error is caught) |
| staging queue persisted with `status: approved, reviewedBy: operator` | yes, `sa-demo-001` |
| `localStorage["nexus_decision_log"]` after approval | key absent |
| decision-log records for the approved action | 0 |

Consequence: every decision made through the staging queue UI is recorded in
the queue and never in the decision log. The decision-log view shows only
the three demonstration records that `getInitialLog()` fabricates on every
load with fresh relative timestamps. Those demo records are what gets
exported by the JSON button. If `logDecision()` is ever called successfully
(it is not, from the UI), the demo records are persisted alongside the real
one, because `logDecision` reads via `getDecisionLog()`, which returns the
demo set when storage is empty, then saves the whole array.

`recordOutcome()` from the Decision Log tab does reach storage, but it can
only attach an outcome to a record that already exists in the log, which
means the demo records.

### Claims measured against this

| claim | where | measured status |
|---|---|---|
| "Persistent audit log" | README module table, `.ai/README.md`, `CLAUDE.md` | persists to one browser profile; no export; overclaim as written |
| "Decision accountability log creates permanent record" | README Security, `.ai/SECURITY.md` | browser profile only; export exists; UI never writes real decisions into it; overclaim as written |
| "Accountability trail - every decision is recorded permanently" | `.ai/README.md` | same |
| "Exportable as JSON for post-incident review" | README | true for whatever is in the store, which at present is demo data |

Scope change applied in this pass: README and `.ai` wording now state the
storage target. Code in `audit.ts`, `decision-log.ts`, `staging.ts` is
untouched, per the work order.

The base layer (`offline/index.html`) has its own audit store
(`nexus_base_audit`) with the same survival conditions, stated on the page at
the point of use, plus text, clipboard, `data:` download, and print export
paths. It is not a fix for the above; it is a separate store on a separate
origin.

---

## E2. The one autonomous role: AI Communications Coordinator

### What the role definition permits without human review

From `src/lib/ics/ai-integration.ts` (`code`), `authorityLevel: 'autonomous'`:

- monitor channel health in real time
- automatically switch to backup channels on primary failure, limited to a pre-approved backup list
- route messages to ICS roles by content
- log all communications
- detect anomalies (jamming, interference)
- generate status reports

Handoff protocol `ho-004` (Emergency Override) carves out the one standing
exception to "AI does not act beyond alerting": the Comms Coordinator may
auto-switch to backup channels per the pre-approved list.

Handoff trigger for this role: "All pre-approved backup channels exhausted:
Comms Lead decides next steps." The human is brought in after the list is
spent, not before.

### Revert path

None is defined. The role has "switch to backup" and no "switch back".
The handoff protocols define recall for delegated tasks (`ho-002`, "RECALL
[task-id]") but the autonomous channel switch is not a delegated task and
is not covered by it. `.ai/AGENT_PROTOCOL.md` restates the pre-approved list
constraint and adds nothing about reversal.

### What code actually implements

No code in the repository implements this role. `ai-integration.ts` is data:
role descriptions rendered by `ICSCommand.tsx`. There is no channel monitor,
no backup list, no switching logic attached to the role.

The only auto-failover code in the repository is the provider chain in
`server/api.ts`. It is not governed by the role, the staging queue, the
authority levels, or any handoff protocol. It is the same shape as what the
role describes: a pre-approved ordered list (Gemini, Claude, OpenAI), switch
on failure, human involved only after the list is exhausted (the 503 to the
client).

### Behaviour under the connectivity loss from channels.md

Measured from `code`; timings are not measured on a device because the
sandbox cannot reproduce a congested backhaul.

Per request, before the inversion (`services/gemini.ts` at the parent commit):

1. Client `fetch('/api/v1/assistant')` with no timeout.
2. Server iterates the active providers in order. Each `provider.call` has
   no timeout set by this repository. The Anthropic and OpenAI calls use
   Node's global `fetch` (undici); the Gemini call uses `@google/genai`
   with default `httpOptions`. Whatever those libraries default to is the
   bound. Under a dead backhaul with fast DNS failure each call fails in
   milliseconds; under a congested backhaul each call waits for its
   library's connect or headers timeout.
3. Three sequential failures, then 503 with `fallback: 'offline_runbook'`.
4. Client then runs the keyword match locally.

Circuit-breaker arithmetic (`CIRCUIT_THRESHOLD = 5`, `CIRCUIT_RESET_MS =
60000`): a breaker opens only after five consecutive failures on that
provider. Under a shared cause all three counters advance together, so the
first five requests each pay for three full provider attempts (fifteen
failed calls) before any breaker opens. After sixty seconds every breaker
goes half-open and the next request pays the full cost again as a probe.
The breakers never learn that the three providers share a cause.

Outcome: the auto-failover consumes the time budget of the first request in
full, and again every minute after that, and produces the same result the
keyword match would have produced instantly. The role's handoff trigger
("all pre-approved backups exhausted") fires each cycle after the list is
spent, which under a shared cause is every cycle.

After the inversion (this commit) the client no longer waits: the base
result is on screen before any provider is asked, enhancement is attempted
only if a three-second health probe already succeeded, and the enhancement
request is aborted at twenty seconds. The server chain and its breakers are
unchanged, so the server-side time budget above still applies to the
enhancement path; it just no longer sits in front of the answer.

No recommendation in this pass.

---

## E3. Template inheritance

Source: commit `bd10e05` ("feat: Initialize Nexus Infrastructure Assistant
app"), 30 files, `package.json` name `react-example`, README titled "Run and
deploy your AI Studio app" with an `ai.studio/apps/...` link. Everything in
that commit is scaffold output. Everything after `ff86c68` is authored.
Method: `code` on git history.

### Arrived from the scaffold

| item | scaffold form | what happened to it | chosen or inherited |
|---|---|---|---|
| `package.json` dependencies | full list: `@base-ui/react`, `@fontsource-variable/geist`, `@google/genai`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `dotenv`, `express`, `lucide-react`, `motion`, `react`, `react-dom`, `recharts`, `shadcn`, `tailwind-merge`, `tw-animate-css`, `vite` | unchanged except `vite` moved to devDependencies; `express` and `dotenv` were in the scaffold before any server existed | inherited |
| `vite.config.ts` `define` of `process.env.GEMINI_API_KEY` into the client bundle | present | removed in `ff86c68` | inherited, then rejected |
| `DISABLE_HMR` env check with an AI Studio comment | present | check kept, comment removed | inherited |
| `metadata.json` (AI Studio applet manifest, `requestFramePermissions`) | present | name and description edited, file kept | inherited; serves no purpose outside AI Studio |
| `.env.example` text "AI Studio automatically injects this at runtime" | present | rewritten in `ff86c68` | inherited, then replaced |
| `APP_URL` env var "for OAuth callbacks and API endpoints" | present | kept in `.env.example`; nothing reads it | inherited |
| `tsconfig.json`: `experimentalDecorators`, `useDefineForClassFields: false`, `allowJs`, `skipLibCheck` | present | unchanged | inherited |
| `components.json` (shadcn `base-nova`, neutral, lucide) | present | unchanged | inherited |
| Directory layout: `components/ui/` and `lib/` at repo root beside `src/` | present (a scaffold quirk: duplicated `scroll-area.tsx`) | moved under `src/` in `ff86c68` | inherited, then fixed |
| `src/services/gemini.ts` filename and Gemini-first assumption | direct client-side `GoogleGenAI` call with the key in the bundle, model `gemini-3-flash-preview` | logic moved server-side; filename kept; Gemini kept as first provider | inherited. The file name, the provider order, and "AI answers first" all come from here. |
| System prompt text, including "dual-factor AI verification" | present in `gemini.ts` | moved verbatim to `server/api.ts` `SYSTEM_PROMPT` | inherited. No code implements dual-factor AI verification. |
| Error path "I'm sorry, I encountered an error... check your infrastructure logs" | present | replaced by the offline fallback in `29431e0`, which kept the AI-first shape and appended the runbook after it | inherited shape |
| Six-panel UI: sidebar tabs TRDAP, Orbital, Emergency, Agent Protocol, AI Assistant | present (five tabs; ICS added later) | kept; ICS Command added | inherited structure |
| `App.tsx` dark class, orange accent, blurred background blobs | present | unchanged | inherited |
| `EmergencyManagement.tsx` action list (Global Kill Switch, Enable Safe Mode, Flush Global Cache, Reroute Traffic (BGP)) and pipelines (TRDAP Recovery, Orbital Realignment, Resource Injection "Sector 7") | present | gates, dialog, audit log added around them; the actions themselves still only write an audit line | inherited content |
| `types.ts` `EmergencyAction`, `Pipeline`, `DeploymentMetric`, `OrbitalNode`, `ChatMessage`, `AgentManifest` | present | extended | inherited |
| `.gitignore` | present | `.env*` lines added | inherited |
| Hard-coded assistant context "TRDAP shows 24 services, avg latency 32ms..." | present in `AIAssistant.tsx` | unchanged, still sent as `context` on every request; README says 16 services | inherited |

### Authored after the scaffold

`server/api.ts`, `.ai/`, `CLAUDE.md`, `src/lib/constants.ts`,
`src/lib/orbital.ts`, `src/lib/trdap.ts`, `src/lib/runbook.ts`,
`src/lib/audit.ts`, `src/lib/ics/*`, `ConfirmDialog.tsx`,
`ErrorBoundary.tsx`, `ICSCommand.tsx`, `mesh/`, `tools/`, `pyroCb.md`.

### What was never chosen

- Provider order and AI-first ordering (fixed in this pass, PART B).
- `express` and `dotenv` as dependencies: they were in the scaffold before a server existed, so "we have an Express proxy" followed from "the template ships Express".
- `metadata.json` and `APP_URL`: AI Studio hosting artefacts with no reader in this repo.
- Decorator and class-field compiler flags no code uses.
- The Geist variable font (three woff2 files in the production bundle) and the `motion` animation library: present because the template had them.
- "Dual-factor AI verification" in the system prompt: a phrase the scaffold generated that the documentation later treated as a property of the system.
- The assistant's fake telemetry context string.
- The file name `gemini.ts` for a module that is now provider-neutral.

No recommendation in this pass.

---

## Note on subfolder licences

`tools/landslide-honesty-toolkit/LICENSE` and
`tools/floodplain-honesty-toolkit/LICENSE` (merged in #6 and #7) are MIT
with a named copyright holder, and the same attribution appears in their
READMEs, guides, and Python headers. This conflicts with "CC0 throughout"
and "no author characterisation". They were left as merged because
rewriting a licence and attribution that this pass did not author is a
decision for the repository owner. The root README states the exception.
