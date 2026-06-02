# Trust & Security — Read This Before You Deploy

This system has **one job: help people coordinate and get safe** when the
normal channels — phone networks, internet, city, county, state — are down or
overwhelmed. Everything below serves that job. Security never gets in the way
of someone reporting a danger.

## The short version

- **Anyone can join in one tap.** Pick a name (or accept one like "House on
  5th"). You're in. No accounts, no setup, no passwords, no understanding
  required. This is the default and it is meant for the middle of a disaster.
- **Every report counts.** A stranger reporting "the bridge is out" is shown
  and acted on, even with zero setup. The system flags *disagreements between
  reports* and lets humans decide — it never silences someone for being new.
- **Trust is optional and invisible.** If your community had time to prepare,
  you can add a layer that makes some reports more trusted than others. You
  will never be shown a "key" or asked to understand cryptography. It happens
  underneath.

## Two ways to run it

### 1. Spontaneous (no warning, default)

Disaster already happened. People grab phones and join. No keys, no vouching.
The system keeps everyone coordinated and uses **disagreement between reports**
to surface what's uncertain. A grandmother and a teenager who never set
anything up are full participants. This is the priority path.

**What you give up:** there's no cryptographic way to tell a real neighbor
from someone pretending. In a small group where everyone knows each other in
person, that's usually fine — you can see who's who. The risk grows with scale
and with strangers.

### 2. Preplanned (you had time, want it stronger)

Before any disaster, a community meets and "adds each other" — typically by
scanning a code at a meeting. To the people doing it, this reads as *"add my
neighbors."* Underneath, their devices quietly exchange keys. Nobody is told
about keys.

Once that's done:

- Reports from known neighbors carry **more weight** than reports from
  strangers who join later.
- A neighbor can **vouch** for a newcomer mid-disaster — they tap *"I know this
  person."* That newcomer is now trusted too, and **they can vouch for the next
  stranger.** Trust spreads outward so it doesn't die if the original
  organizers are unreachable, hurt, or out of range.
- Trust **fades with distance.** Someone vouched directly by an organizer is
  trusted more than someone four vouches removed. The system tracks this
  automatically. Nobody is ever cut to zero — distant or unvouched people are
  trusted *less*, never *silenced*, because in a disaster their report might be
  the only one, and it might be true.

## "I want this MORE secure"

The defaults above optimize for **getting people safe with the least
friction**. If your situation is higher-threat — you expect bad actors, you're
coordinating something sensitive, the group is large and full of strangers —
you can tighten it. Each of these is a deliberate trade of *accessibility* for
*integrity*, and each one makes the system slightly harder for ordinary people
to use:

1. **Require preplan keys to join.** Turn off keyless onboarding entirely. Only
   devices that exchanged keys at a setup meeting can participate. Stops
   impersonation cold — and locks out anyone who didn't make the meeting,
   including people who badly need help. High cost. Use only when you know the
   threat justifies it.
1. **Encrypt the traffic, not just sign it.** By default reports are signed
   (proving who sent them) but readable by anyone listening nearby, including
   your location. If you're hiding *from* someone (the hostile-encounter case),
   switch to encrypting reports so only your community can read them. Requires
   the preplan key exchange. See `lib/mesh/` transport notes.
1. **Lower the trust decay / raise the floor.** Make distant vouches count for
   much less, or make unvouched strangers count for almost nothing in
   *disagreement resolution* (they still show up; they just don't outweigh
   known people). Tunable as a community policy — the group votes on it; no
   developer sets it for you.
1. **Shorten the carry lifetime.** Reports are carried and re-shared for a
   while (so a message crosses a dead zone via someone walking through). A
   shorter lifetime means less old data floating around to be replayed or
   spoofed, at the cost of messages not reaching as far in time.
1. **Cap what one device can flood.** Limit how many reports a single device
   can inject, so one compromised or malicious phone can't bury the real
   signal. On by design; you can tighten the cap.

## The one thing the system guarantees regardless

Every report is **content-addressed and tamper-evident.** Its identity is a
fingerprint of *what it says* — so the same report arriving by ten different
routes is recognized as one report, and altering a report changes its
fingerprint and is detectable. This holds whether or not you ever turn on a
single security feature above. It's the floor nobody can fall through.

## What we deliberately did NOT do

- No central server anyone has to trust or that can be seized/shut off.
- No admin, no master key, no override of local decisions. A community node has
  no power another node lacks — it just remembers longer and stays on.
- No requirement to understand any of this to be kept safe by it.
