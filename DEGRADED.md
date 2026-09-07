# Degraded-mode test

This is the primary test of the system, not a fallback test. It answers one
question: with nothing but the device and the file, can a person work every
runbook procedure end to end?

Re-run after any change to `offline/index.html` or `offline/RUNBOOK.md`.
Append a new dated block; do not overwrite old ones.

## Procedure

Run this on the actual target device, the one that will be in the field.

1. Disable all networking on the device: airplane mode, Wi-Fi off, Ethernet
   unplugged, mobile data off. Confirm the browser reports offline.
2. Do not start the server process. Do not start the dev server. Nothing
   listening on any port.
3. Open `offline/index.html` from local storage. A copy on the device itself,
   not a network share. In the browser, File > Open, or tap the file in the
   file manager. Confirm the status strip reads `origin: file://`.
4. Work through each of the five runbook procedures end to end: find it via
   the search box, expand it, check every step, read the rollback and impact,
   press "Mark procedure complete". Then: record one decision with a
   rationale, record one manual intervention, show the export text, and
   attempt the download.
5. For every row record a state and, if not `true`, the exact element that
   stopped you (button, field, message, or missing content).

## States

Six states. A two-state result (pass/fail only) means the test was not run.

| state | meaning |
|---|---|
| `true` | worked end to end on this device, this run |
| `false` | did not work; the blocking element is named |
| `lapsed` | worked on an earlier run, not re-verified on this run after a change |
| `partial` | some steps worked, some did not; which ones is named |
| `unknown` | not attempted, or the result could not be observed on this device |
| `undifferentiated` | ran, but the observation cannot tell success from failure (for example a download button that does nothing visible and no file can be found) |

## Results

### 2026-09-06, headless Chromium in a Linux container

Not the target device. This run establishes that the file works with no
network and no server in a stock browser engine. It does not establish
anything about the field device's browser, file picker, or download path.

| item | device | networking | server process | origin | state | note |
|---|---|---|---|---|---|---|
| open file | Linux 6.18.44 container; Chromium 141.0.7390.37 headless (Playwright 1.56.1) | disabled (browser context offline) | none | `file://` | `true` | title rendered, status strip: storage=localStorage, browser reports offline |
| search box | same | same | none | `file://` | `true` | "everything is down, total outage" resolved to rb-001 |
| rb-001 Total Service Outage | same | same | none | `file://` | `true` | expanded, 7/7 steps checked, rollback 3 items, impact shown, completion logged to audit |
| rb-002 Orbital Node Drift | same | same | none | `file://` | `true` | 6/6 steps, rollback 2, impact, completion logged |
| rb-003 API Gateway Saturation | same | same | none | `file://` | `true` | 6/6 steps, rollback 2, impact, completion logged |
| rb-004 AI Assistant Unavailable | same | same | none | `file://` | `true` | 5/5 steps, rollback 2, impact, completion logged |
| rb-005 Data Pipeline Failure | same | same | none | `file://` | `true` | 6/6 steps, rollback 2, impact, completion logged |
| step state after reload | same | same | none | `file://` | `true` | rb-001 still 7/7 after reload in the same profile |
| decision record | same | same | none | `file://` | `true` | blank rationale rejected with message; filled record logged as APPROVED |
| manual intervention record | same | same | none | `file://` | `true` | high-risk path required typed CONFIRM; logged |
| export as text | same | same | none | `file://` | `true` | export box populated, 14 lines |
| export as download | same | same | none | `file://` | `unknown` | data: URI prepared on the link; the browser save dialog is not exercisable headless. Must be observed on the target device. |
| localStorage blocked | same | same | none | `file://` | `true` | with localStorage throwing, status strip read "memory only (export before closing)" and step checks still worked in memory |
| network requests during run | same | same | none | `file://` | `true` | zero non-`file://` requests observed; zero page errors |

Harness: a Playwright script that opens the file in an offline browser
context and drives the elements listed above. It is not in the repo because
Playwright is not stdlib and the base layer must not acquire a test-time
dependency it cannot run without. The steps it performs are the ones in
"Procedure" above.

### Target device: not yet run

| item | device | networking | server process | origin | state | note |
|---|---|---|---|---|---|---|
| open file | (state the device, OS, browser, version) | | | | `unknown` | |
| search box | | | | | `unknown` | |
| rb-001 Total Service Outage | | | | | `unknown` | |
| rb-002 Orbital Node Drift | | | | | `unknown` | |
| rb-003 API Gateway Saturation | | | | | `unknown` | |
| rb-004 AI Assistant Unavailable | | | | | `unknown` | |
| rb-005 Data Pipeline Failure | | | | | `unknown` | |
| step state after reload | | | | | `unknown` | |
| decision record | | | | | `unknown` | |
| manual intervention record | | | | | `unknown` | |
| export as text | | | | | `unknown` | |
| export as download | | | | | `unknown` | |
| RUNBOOK.md readable without the HTML | | | | | `unknown` | open the .md in any text viewer on the device |

Until this block is filled in on the target device, the field-readiness of
the base layer is `unknown`, whatever the headless run says.

## Known limits of the base layer (state them, do not hide them)

- Storage is per browser profile per device. See the survival note at the
  bottom of the page and `INVESTIGATION.md` E1.
- The download link uses a `data:` URI. Some mobile browsers block or ignore
  downloads from `file://` pages. The text export and print paths exist for
  that case.
- On iOS, opening a local `.html` from the Files app renders it in a preview
  that may not run scripts. `RUNBOOK.md` exists for that case; record it as
  `partial` with the element named.
