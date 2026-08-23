---
ticket: unit-tests-auth-service
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Spec — unit-tests-auth-service

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit tests — auth service and auth store (roadmap Phase 9).

## Business Goal

The sign-in service is the client half of every session a shopper has. It sends
the code, verifies it, keeps the session alive, decides what happens when the
session dies, and writes the state every screen reads afterwards. It is a
thousand lines with one small test file against it. A silent change here logs
everybody out mid-action, leaves a shopper half signed-in with a stale profile,
or drops the prompt that lets a verified shopper get their real account back —
and nothing in the repository would fail. This ticket makes that class of change
fail loudly, and removes the dead paths that make the file harder to read than it
needs to be.

## User Story

> As a shopper signing in, I want the app to record my session and my profile
> correctly after each auth step, so that I am not left half signed-in, shown a
> stale profile, or logged out while I am still using the app.

## Areas in scope (by role)

Named by the job they do, not by path — paths belong to `plan.md`.

1. **The sign-in service** — the client-side service that sends and verifies a
   code, verifies a changed phone number, exchanges a dying session for a fresh
   one, runs the expiry cycle, updates the name and the profile across the
   shopper's services, and uploads a profile picture.
2. **The auth state slice** — the shared state that service writes: the signed-in
   user, the per-service user records, the verification id, the attempt counter,
   and the markers that drive the re-verification prompts.
3. **The dead paths inside both** — code with no caller and no reader, removed
   rather than tested.

## Functional Requirements

### FR-1 — Sending a code

The suite proves that a successful send records the verification id, starts the
client-side cooldown for that number with the duration the server asked for (and
the documented default when it asks for none), and counts the number against the
per-session cap. It proves that a refusal which still carries a cooldown starts
that cooldown anyway, and that every failure path reports the error, calls the
caller's error hook, leaves a message in state for the screen, and re-raises so
the caller knows.

### FR-2 — Verifying a code, the success path

The suite proves what a shopper ends up with after a correct code: the market,
chat, stories and wallet user records are all written and all marked verified;
the temporary user carries whether the account already existed; the
re-verification wait is released and the prompt marker cleared; the analytics
identity is set; and the "an existing guest just became this user" event fires
**only** when the two ids actually differ. It proves the call reports back
whether the account already existed and under what name.

### FR-3 — Verifying a code, the failure ladder

The suite proves each rejection the service distinguishes — an unusable code, an
unknown user, an unsuccessful reply — leads to the state the screen expects: an
unknown user leaves a message and does **not** burn an attempt; every other
failure burns one attempt and flags the failure. It proves a failed verification
is reported to analytics with the flow it was opened from, and that the error
reaches the caller.

### FR-4 — Verifying a changed phone number

The suite proves this path is separate from signing in: it marks the profile's
phone as verified, mirrors that into the secure profile copy, and **returns** the
one-time token, because the caller's next step — saving the profile — is what
consumes it.

### FR-5 — Exchanging a dying session

The suite proves the outcome the caller acts on: no exchange at all while a
logout is running; "not eligible" when the server says so; "refreshed" only when
the server both answers successfully and says it refreshed; and a network failure
reported as eligible-but-not-refreshed, so the caller falls through to the expiry
flow instead of treating it as a hard no. It proves a call with no request
context asks for a plain exchange rather than naming a request.

### FR-6 — The expiry cycle, when the session survives

The suite proves that a last-chance renewal on the server ends the cycle without
cancelling anything the renewal just saved, and releases waiters — **unless** a
re-verification is already on screen, which is left alone so an in-progress code
entry is never yanked away.

### FR-7 — The expiry cycle, when the session is gone

The suite proves the difference a shopper feels: a session that belonged to a
verified shopper arms the "please log in again" prompt and keeps their phone
number so they do not have to type it again, while a guest session is cancelled
silently. It proves the phone is captured **before** the cancellation, that a
placeholder phone is not kept, that an already-armed re-verification is never
replaced, that concurrent callers share one cycle and one outcome, and that the
"registering" flag is restored whichever way the cycle ends.

### FR-8 — Updating the name

The suite proves the name is written to state and to the secure copies
immediately, before any request, and pins what happens when a service then
refuses: the change stays. That is today's behaviour and it is recorded as a
finding, not corrected here.

### FR-9 — Updating the profile

The suite proves each service leg writes both the shared state and the secure
copy for that service; that a leg is skipped when the shopper has no record for
it; that the picture path is translated to the form each service expects; and
that when a later leg fails, every leg that already succeeded is put back and the
shopper is told once. It proves the shopper's missing service records are looked
up before the legs run.

### FR-10 — Picture paths

The suite proves the two-way path mapping in isolation: the form stored for the
market, the form the other services expect, an empty value, and a value that is
already in the target form.

### FR-11 — Uploading a picture

The suite proves the upload refuses to run when it is not configured, that a
successful upload reports the stored location, and that a failed upload reports
the failure rather than a picture. It pins today's behaviour when the failure
reply cannot be read at all.

### FR-12 — The auth state slice

The suite drives the state slice directly and proves the transitions the service
depends on: cancelling a session **keeps** the shopper's records and marks them
unverified when the cancellation comes from an expiry, and clears them
completely otherwise, and both reset the attempt counter and the message; the
sign-in writes merge into existing records and replace absent ones; a failed
attempt decrements the counter; and the notification topic list adds and removes
one topic at a time. It pins that renaming updates the signed-in user but not the
profile record — today's behaviour, recorded as a finding.

### FR-13 — Removing the dead paths

The dead chain around the one-time verification token is removed whole: the
browser-storage copy, the two service-login routines that were its only real
readers and that nothing calls, and the state field it fed that nothing reads.
Also removed: the unused phone helper, the unused callback parameter of the
verify call and the empty callbacks its call sites pass, the commented-out
consistency check, and the state type that is never applied and has drifted from
the state it describes. Nothing that still has a caller is touched, and no
behaviour changes.

### FR-14 — Findings recorded

Every behaviour that reads like a defect but is left alone is pinned by a test
that describes what the code actually does, and written up as a finding in the
ticket. A finding without a test is not enough.

## Non-Functional Requirements

- **NFR-1 — No real I/O.** No test reaches a network, a media server, an
  analytics service or a real cookie jar. A call that escapes a stand-in must
  fail the test, not quietly succeed or quietly fail.
- **NFR-2 — No behaviour change.** The only source edits are the removals in
  FR-13, each one proven to have no caller and no reader. A working module that
  resists testing produces a finding, not a refactor.
- **NFR-3 — Deterministic.** Anything ambient — the clock, browser storage, the
  current address bar, environment values, state held between calls at module
  level — is pinned or reset, so the suite gives the same answer on any machine
  and in any order.
- **NFR-4 — A test that cannot fail is not a test.** Several paths here swallow
  their own errors by design. Every test over such a path must be able to tell
  "it worked" from "it was silently skipped", and every assertion about state
  must observe the state, not merely that something was called.
- **NFR-5 — Readable failures.** A failing test names the user-facing
  consequence, not the internal symbol.
- **NFR-6 — Runs in the existing gate.** The suite runs under the repository's
  single test command, with no new command, no pipeline and no extra service.
- **NFR-7 — The existing suite keeps passing.** The refresh single-flight tests
  written earlier are not rewritten, and still pass unchanged.

## Constraints

- **C-1** — The sign-in service sits under a protected path. Its tests live in
  the mirror, `plan.md` says so, and `verify.md` carries the protected-path
  statement (TR-3). The combined store must not be modified.
- **C-2** — The harness, fixtures and stand-ins built in earlier phases are
  reused. A new shared helper is added only where nothing existing fits.
- **C-3** — No test name, message or comment may name the technology behind a
  backend. Backends are referred to by role: the **core** backend and the
  **gateway**.
- **C-4** — Everything in scope is client code and runs in a browser-like
  environment.
- **C-5** — The validation profile is `full` (lint, typecheck, unit tests, and
  the production build). The build is included because FR-13 deletes exported
  routines from several service modules, which is exactly the class of change a
  type check can pass and a build cannot. The roadmap's `tests-and-types` label
  is not a defined profile in this repository.
- **C-6** — Coverage reporting is already folder-wide; this ticket changes no
  coverage configuration.
- **C-7** — The refresh single-flight behaviour is already covered and is not
  re-tested. Its **result mapping** is not covered and belongs to FR-5.
- **C-8** — A removal happens only where every caller and every reader has been
  found and is itself dead. A chain goes whole or not at all: the stored copy is
  never removed while something still reads it, and a reader is never removed
  while something still calls it.
- **C-9** — Nothing scheduled for removal gets a test.

## Edge Cases

- A send that is refused with a cooldown, and one refused without one.
- A send that fails before the server ever replies.
- A code verified by a shopper who was already this same user, so no guest
  mapping happened.
- A reply that carries no chat, stories or wallet record.
- A re-verification armed by another failing request while the expiry cycle is
  still waiting for its answer.
- An expired session whose stored phone is the placeholder value.
- An expired session with no stored profile at all.
- A second caller arriving while an expiry cycle is already running.
- A profile update where the shopper has a market record but no chat or stories
  record.
- A profile update that fails on the last leg after the earlier legs succeeded.
- A picture upload attempted with no configuration present.
- A failed upload whose error reply cannot be read as data.
- A cancellation applied to a session that was already empty.
- Repeated failed attempts past the point where the counter runs out.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Partly answered; mechanism deferred.** Scope decision: the suite must observe the **resulting state**, not merely that an action was called — an assertion that a stand-in was invoked does not satisfy any state criterion here. How that observation is arranged is an approach decision for `/plan`. | NFR-4, FR-12; Open Questions (for `/plan`) |
| OQ-2 | **Partly answered; mechanism deferred.** Scope decision: one convention for the outbound-call boundary across the whole suite, not a different one per file, and a call that escapes it fails the test. Which mechanism is `/plan`'s to pick. | NFR-1, NFR-4; Open Questions (for `/plan`) |
| OQ-3 | **Answered: yes, directly.** The state slice is driven on its own, not only through the service. It is a named target of this phase, and its branchiest transition is unreachable from the service alone. Plain setters stay excluded. | FR-12; AC-30 … AC-34 |
| OQ-4 | **Answered: in scope.** The upload is covered, including the unreadable-error-reply case, which is pinned as a finding rather than fixed. Leaving it out would leave the picture flow half covered. | FR-11; AC-28, AC-29 |
| OQ-5 | **Answered: the whole token chain plus the local dead code.** Removed: the browser-storage copy of the one-time verification token, the two uncalled service-login routines that read it, the unread state field it fed, the unused phone helper, the unused callback parameter and the empty callbacks passed to it, the commented-out consistency check, and the never-applied state type. **Kept:** the disabled profile leg marked "under development", because it is switched off, not dead. | FR-13, C-8; Out of Scope |
| OQ-6 | **Answered: `full`.** Lint, typecheck, unit tests **and** the production build, because FR-13 deletes exported routines from several service modules. `tests-and-types` is not a defined profile here; the roadmap wording is stale and is not followed. | C-5 |
| OQ-7 | **Deferred.** How many test files there are and what each is called is a layout decision for `/plan`. The scope decision is settled here: the existing refresh suite is not rewritten (NFR-7), and every acceptance criterion below must be traceable to a test. | Open Questions (for `/plan`); NFR-7 |
| OQ-8 | **Deferred.** Whether the removals land before or after the tests within the implement stage is a sequencing decision for `/plan`. The scope decision is settled here: nothing scheduled for removal is ever given a test (C-9). | Open Questions (for `/plan`); C-9 |
| OQ-9 | **Answered: findings carry tests.** Each surviving defect-like behaviour is pinned by a test that states what the code does today, and is written up in the ticket. Items removed under FR-13 are deletions, not findings. The naming-rule violations in the source comments are recorded in the ticket only; changing a comment is not in this ticket. | FR-14; AC-33, AC-34 |

## Open Questions

- **OQ-1** — By what means the suite observes state written by the service, given
  that the shared stand-in carries almost none of the actions involved. `/plan`
  decides.
- **OQ-2** — Which single mechanism stands in for the outbound-call boundary
  across the suite. `/plan` decides.
- **OQ-7** — How the suite is split into files and what each is called. `/plan`
  decides.
- **OQ-8** — Whether the removals land before or after the new tests inside the
  implement stage. `/plan` decides.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A successful send records the verification id, starts the cooldown for that number using the duration the server gave, and counts the number against the session cap. | FR-1 |
| AC-2 | A send whose server gives no duration uses the documented default cooldown. | FR-1 |
| AC-3 | A refusal that carries a cooldown still starts that cooldown, leaves the refusal message in state, and raises. | FR-1 |
| AC-4 | A send that fails before any reply reports the error, calls the caller's error hook, and raises — and starts no cooldown. | FR-1, NFR-4 |
| AC-5 | A correct code writes the market, chat, stories and wallet records, each marked verified. | FR-2 |
| AC-6 | A correct code releases the re-verification wait and clears the prompt marker. | FR-2 |
| AC-7 | The guest-to-user mapping event fires only when the previous id differs from the new one. | FR-2 |
| AC-8 | A correct code reports back whether the account already existed, and the name on it. | FR-2 |
| AC-9 | An unknown user leaves a message in state and does **not** decrement the attempt counter. | FR-3 |
| AC-10 | Any other rejection decrements the attempt counter, flags the failure, and raises to the caller. | FR-3 |
| AC-11 | A failed verification is reported with the flow it was opened from. | FR-3 |
| AC-12 | Verifying a changed number marks the profile phone verified, mirrors it to the secure profile copy, and returns the one-time token to the caller. | FR-4 |
| AC-13 | No session exchange is attempted while a logout is running. | FR-5 |
| AC-14 | An exchange is reported as refreshed only when the server answers successfully **and** says it refreshed; a server "not eligible" is reported as not eligible. | FR-5 |
| AC-15 | A network failure during the exchange is reported as eligible but not refreshed, so the caller falls through to the expiry flow. | FR-5 |
| AC-16 | An exchange requested with no request context asks for a plain exchange rather than naming a request. | FR-5 |
| AC-17 | A server-side renewal ends the cycle without cancelling the session, and releases waiters. | FR-6 |
| AC-18 | A renewal does **not** release an already-armed re-verification. | FR-6 |
| AC-19 | An expired verified session arms the log-in-again prompt and keeps the shopper's phone for it; the phone is captured before the cancellation, and a placeholder phone is not kept. | FR-7 |
| AC-20 | An expired guest session is cancelled silently, with no prompt. | FR-7 |
| AC-21 | An already-armed re-verification is never replaced by the expiry prompt. | FR-7 |
| AC-22 | Concurrent callers share one expiry cycle and receive the same outcome, and the "registering" flag is restored whichever way the cycle ends. | FR-7 |
| AC-23 | A rename writes the new name to state and to the secure copies before any request, and a later refusal leaves it there — pinned and recorded as a finding. | FR-8, FR-14 |
| AC-24 | Each profile leg writes both the shared state and that service's secure copy, is skipped when the shopper has no record for that service, and sends the picture path in the form that service expects. | FR-9 |
| AC-25 | A failure on a later leg puts every completed leg back and tells the shopper once. | FR-9 |
| AC-26 | Missing service records are looked up before the legs run. | FR-9 |
| AC-27 | The picture path mapping is proved in both directions, for an empty value and for a value already in the target form. | FR-10 |
| AC-28 | An unconfigured upload refuses to run; a successful upload reports the stored location; a failed upload reports the failure and not a picture. | FR-11 |
| AC-29 | Today's behaviour when a failed upload's reply cannot be read is pinned and recorded as a finding. | FR-11, FR-14 |
| AC-30 | Cancelling from an expiry keeps the shopper's records and marks them unverified; cancelling otherwise clears them; both reset the attempt counter and the message; an already-empty session stays empty. | FR-12 |
| AC-31 | Sign-in writes merge into existing service records and replace absent ones. | FR-12 |
| AC-32 | A failed attempt decrements the counter, and repeated failures past the limit are pinned as they behave today. | FR-12 |
| AC-33 | Adding and removing a notification topic changes only that topic. | FR-12 |
| AC-34 | Renaming updates the signed-in user and not the profile record — pinned and recorded as a finding. | FR-12, FR-14 |
| AC-35 | Every removal in FR-13 is proved to have no remaining caller or reader before it is made, and the application behaves the same after it. | FR-13, C-8, NFR-2 |
| AC-36 | Nothing removed under FR-13 has a test written for it. | C-9 |
| AC-37 | No test performs real I/O, and a call that escapes a stand-in fails the test rather than passing quietly. | NFR-1, NFR-4 |
| AC-38 | Every criterion about written state is proved by observing the state, not by observing that an action was called. | NFR-4 |
| AC-39 | The suite passes repeatably, independent of machine clock, execution order and leftover browser state. | NFR-3 |
| AC-40 | The tests written earlier for the refresh single-flight are unchanged and still pass. | NFR-7, C-7 |
| AC-41 | No test name, message or comment names the technology behind a backend. | C-3 |
| AC-42 | Every behaviour that reads like a defect and is left alone has a test that pins it and a written finding in the ticket. | FR-14 |

## Out of Scope

- The auth route handlers, the send-code server action, and the server-side
  limiter — a later phase owns them.
- Sign-in screens and widgets, including the ones whose empty callbacks are
  removed under FR-13; only the call itself changes, not what the screen does.
- The sibling services this ticket only stands in for — chat, stories, wallet,
  home — beyond deleting the two routines nothing calls.
- The disabled profile leg marked "under development", and its unreachable
  rollback. Switched off is not dead.
- The unreachable "send a name with the code" branch: every caller passes an
  empty name, but the server still accepts the field, so it is recorded as a
  finding and left alone.
- Fixing anything a finding records, including the behaviours pinned by AC-23,
  AC-29 and AC-34.
- Changing source comments, including the ones that name a backend technology.
- Adding a pipeline, a coverage threshold, or a browser-level test suite.
