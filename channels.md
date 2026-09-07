# Channels and failure modes

One row per channel, one column per failure mode. A cell is `survives` or
`fails`. Two channels are redundant with respect to a failure mode only if
they do not both fail under it. Redundancy is computed per failure mode,
never as a single number.

`test_channels.py` holds the same table as data and computes the surviving
set per mode. Edit both together.

## Failure mode definitions

| mode | meaning, as used in this table |
|---|---|
| no power | Grid power at the operating site is lost. The operator's own device has a charged battery. The host running the server process (`server/api.ts`) and the dev server is on site grid power and stops. |
| no local net | The operator device cannot reach the host running the server process (LAN, Wi-Fi, or USB tether down, or the host is elsewhere). |
| no backhaul | The site cannot reach the internet: tower down, fibre cut, congested or destroyed backhaul. Local net may be up. |
| provider down | One vendor's API is down or returning errors. Other vendors are up. |
| account/key | One vendor's key is missing, revoked, expired, over quota, or the account is suspended. |
| rate limit | One vendor throttles this key. Other vendors do not. |

## Table

| channel | no power | no local net | no backhaul | provider down | account/key | rate limit |
|---|---|---|---|---|---|---|
| Gemini API | fails | fails | fails | fails (when it is the one down) | fails (when it is the one affected) | fails (when it is the one throttled) |
| Claude API | fails | fails | fails | survives (when another is down) | survives (when another is affected) | survives (when another is throttled) |
| OpenAI API | fails | fails | fails | survives | survives | survives |
| offline base (`offline/index.html` + `offline/RUNBOOK.md`) | survives | survives | survives | survives | survives | survives |

For the three per-vendor modes the table is read as "the named vendor is the
one hit". Any one of the three can be the one hit; the other two survive.
That is real redundancy, and it is the only redundancy the three API rows
provide.

## Surviving set per failure mode

| mode | surviving set (all channels) | surviving set (API providers only) |
|---|---|---|
| no power | {offline base} | {} |
| no local net | {offline base} | {} |
| no backhaul | {offline base} | {} |
| provider down | {two remaining APIs, offline base} | {two remaining APIs} |
| account/key | {two remaining APIs, offline base} | {two remaining APIs} |
| rate limit | {two remaining APIs, offline base} | {two remaining APIs} |

## Finding

Against connectivity loss, the three API providers are ONE channel.

Under no power, no local net, and no backhaul, the surviving set among the
API providers is empty. All three fail at the same instant from the same
cause. Per-provider circuit breakers do not change this: a breaker opens
after five consecutive failures on that provider, and under a shared cause
all three breakers open on the same schedule.

The providers are redundant against each other for provider outage, key or
account problems, and rate limiting. Those are the modes the failover chain
and circuit breakers were built for, and the claim in the README is scoped
to exactly those.

The only channel that survives every mode in the table is the offline base.
That is why it is the base of the stack and not the last fallback.

## Not in the table

The connected-mode user interface (React application served by Vite or a
host) is not a channel in this table, but it shares the API rows' fate for
the first three modes: it is served over the local net from a host on site
power. When those fail, the page does not open at all. This is the reason
the base layer is a file on the operator's device rather than a route in
the application.
