---
ticket: otp-entry-three-attempt-lock
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-08-29
links:
  clickup:
  github:
---

# Intake — otp-entry-three-attempt-lock

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`otp-entry-three-attempt-lock` — no ClickUp task, no GitHub issue. The request
came directly from the owner in conversation.

## Ticket Summary

A shopper can type a wrong OTP code as many times as they like. Nothing in the UI
stops them, so they can keep guessing. Cap it at **3 wrong codes per sent code**.
After the third wrong code, disable the code boxes — the same way the UI already
disables them when the code has expired. After the **first** wrong code, show how
many tries are left.

## Ticket Metadata

- id / slug: `otp-entry-three-attempt-lock`
- title: Lock the OTP code boxes after 3 wrong codes, and show how many tries are left
- owner: developer
- created: 2026-08-29
- links: —

## User Story

> As the Trydos team, we want the OTP code boxes to lock after 3 wrong codes, so
> that a person cannot sit and guess a code, and so that a shopper who mistypes
> is told how many tries are left instead of guessing in the dark.

## What the request covers

**Entering a code only.** Sending a code is already limited elsewhere (the
per-number cooldown and session cap in `utils/otpLocks`, plus the server-side
limiter and IP rules). This ticket does not touch sending at all.

### Surfaces in scope

Three places in the app where a shopper types an OTP, all of them wired and
reachable today:

| Surface | Reached from |
|---|---|
| `components/Login/Enhanced/FullEnhancedLoginWidget.tsx` | The login / signup modal, opened by `setLoginOpen(true)` from the navbar, add-story, and the like button |
| `components/Login/Enhanced/VerifyPhoneFlow.tsx` | The re-auth widget (`ConfirmMobilePhoneWidget`), the settings phone change (`PersonalInfoForm`, `VerifyUser`), and the session-expired prompt |
| `components/Login/Enhanced/InlineVerifyPanel.tsx` | The cart order button (`components/Cart/OrderButton.tsx`) |

The last two share the flow hook `components/Login/Enhanced/usePhoneVerifyFlow.ts`.
The first keeps its own copy of the same attempt counter.

### Explicitly out of scope

- **`NewLoginDesign/`** — the newest login design. Nothing imports it except the
  demo page `app/(client)/[lang]/loginDemo/page.tsx`. It is not wired into the
  app, so it gets nothing here. This is the exclusion the owner asked for.
- **Sending / resending a code.** Already limited. Not touched.
- **Any server-side or backend change.** None is asked for and none is needed.

## Decisions already taken (do not reopen later)

These are recorded now so that a later stage does not treat them as open
questions or as findings.

1. **The counter lives in memory, in the running flow.** A page reload starts it
   over. The owner chose this. It is the smallest change and needs no storage
   code, no expiry, and no reset path.
2. **This is UI feedback, not a security control.** It stops a person poking at
   the form; it is not meant to stop a scripted attacker, and it cannot. Real
   enforcement already sits on the backend and in the send limits. "A reload
   bypasses it" is a known and accepted property of the chosen design, not a
   defect.

   **The owner accepted this, and gave the reason:** a code only lives about
   **1 minute**. After that the backend refuses it, even when the digits are
   right. So reloading the page to win 3 fresh tries buys the guesser almost
   nothing — the code they are guessing at is already dead or about to be. A
   memory-only cap is the right size for the thing it guards.
3. **Every failed verify counts as one try.** The app already shows the same
   "please enter the correct code" message for every verify failure, wrong code
   or transport error alike. Telling the two apart would be new behaviour and new
   code. Keep the existing behaviour and count them the same.
4. **A resend clears the counter.** A new code is a new set of 3 tries. The two
   places that reset the attempt count on a successful send already exist; the
   lock follows the same reset.
5. **Resend stays available while locked.** Exactly like the expired case: the
   boxes are dead, the resend button is the way out, and the existing send
   cooldown still applies to it. No new "unlock" control.
6. **Three is a fixed number in code.** No environment variable, no remote
   config, no per-surface override.

## Observation for the next stage — the code's life is set to 120s, not 60s

Found while checking the surfaces. **Not** a change this ticket makes; recorded
so `research` and `spec` see it instead of tripping over it.

`components/Login/Enhanced/screens/EnterPinScreen.tsx` decides when a code is
spent from its own `timerSeconds` prop, which defaults to **120**. **No caller
passes it** — the login modal, `VerifyPhoneFlow` and the cart panel all take the
default. So the boxes stay enabled for 2 minutes.

The owner says the backend gives a code about **1 minute**. If that is right,
there is a window of roughly 60 seconds where the boxes are open on a code the
backend will always refuse. Under this ticket, each of those refusals spends one
of the 3 tries, so a slow shopper can be locked out without ever guessing.

Two clocks are easy to mix up here, and `EnterPinScreen`'s own comment warns
about it:

- `OTP_COOLDOWN_SECONDS` (60) — how long until this number may be sent **another**
  code. A send limit, not a code lifetime.
- `timerSeconds` (120) — how long the code in the shopper's hand is worth typing.

They are not the same number and must not be wired together. The screen was
broken twice before by treating the cooldown as the code's life.

**Open for the owner:** align `timerSeconds` with the real backend lifetime, or
leave it. Either way it is a separate decision from the 3-try cap, and this
intake does not settle it.

## Acceptance Criteria Presence Check

- Present? **no** — the request is clear, but it carries no written `AC-n` list.
- Notes: the behaviour is small and fully described above (cap at 3, disable like
  expired, show remaining tries after the first failure, reset on resend). The
  `spec` stage writes the `AC-n` ids. Nothing here is ambiguous enough to block.

## Test Cases Presence Check

- Present? **no**
- Notes: the attempt counting and the locked state can be reproduced without any
  backend, so they belong in the unit suite (`tests/`), which gates every pull
  request. The `plan` stage names the file and the cases.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no**
- Is the goal to *choose between options*? **no**
- Is the change to make already known, leaving only building it? **yes** — the
  behaviour, the surfaces, and the exclusion are all settled above.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` (via `/wf:start-ticket`) |

## Keeping this small

The owner asked directly for no over-engineering. The following would all grow
this ticket beyond what was asked, and none of them is wanted:

- storing the attempt count in `localStorage` or next to `utils/otpLocks`
- a lockout timer, a countdown, or an auto-unlock
- a new store slice, a new context, or a new shared component
- a new backend call, a new API route, or a new endpoint
- telling wrong codes apart from network errors
- adding the same lock to `NewLoginDesign/`
- refactoring `FullEnhancedLoginWidget` to use `usePhoneVerifyFlow`

## Missing Information

None. Two questions were asked at intake and both were answered by the owner:

1. Should the count survive a reload? → **No, memory only.** The focus is code
   entry; sending already has IP and session caps.
2. Which surfaces? → The clarification showed there are two newer designs. The
   unwired one is `NewLoginDesign/` (the `/loginDemo` page), which is excluded.
   `FullEnhancedLoginWidget` is live, so it stays in scope.

## Readiness Status

`READY`

- Justification: the behaviour is one sentence, the three surfaces are named and
  verified as wired, the excluded surface is named and verified as unwired, and
  the six design decisions that could otherwise have become open questions are
  written down. Nothing blocks `research`.
