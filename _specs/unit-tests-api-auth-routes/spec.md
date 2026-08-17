---
ticket: unit-tests-api-auth-routes
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Spec — unit-tests-api-auth-routes

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit tests for the authentication route handlers and the proxy's refusals.

## Business Goal

These routes are where the app decides who someone is. They mint every
credential the shopper carries, they clear them again at logout, and they are the
one place that refuses a direct call to the OTP send path. None of them has ever
been executed by a test. Every other part of the sign-in journey is covered, so
this is the last hole in it — and it is the hole the live suite is about to run
straight through. Covering these routes means a red live run says "staging
changed", not "we do not know". It also means a credential that stops being
cleared at logout, or a refusal that quietly starts passing through, is caught
before it reaches a real user.

## User Story

> As the owner of this codebase, I want the authentication routes covered by unit
> tests, so that when the live suite goes red on sign-in I can tell whether our
> code broke or the backend did.

## Functional Requirements

- **FR-1 — Verification mints the right credentials and leaks none.** What the
  sign-in route stores after a successful verification, what it refuses to store,
  how it survives a sub-service that failed, and what it removes from the answer
  it sends back.
- **FR-2 — Session recovery makes the right choice.** The exchange route and the
  expiry route each branch on the state they find — a logout in progress, a
  usable refresh credential, a dead session — and each branch has its own
  outcome. Every branch is proven.
- **FR-3 — Teardown clears everything it promises to clear.** The logout route
  clears the whole credential list and arms the guard that stops a late failure
  resurrecting the session. The scoped clearing route clears only what it was
  asked for, and only from the allowed list.
- **FR-4 — Registering a guest replaces the previous identity completely.** No
  credential or profile from the person who was here before may survive a new
  guest token.
- **FR-5 — The identity reads and the profile write behave as their callers
  expect.** Reading the current profile, reading the wallet credential, and
  merging an update into a stored profile — including keeping a freshly rotated
  pair from being overwritten by a stale one.
- **FR-6 — The proxy refuses what it must refuse.** A call aimed at the OTP send
  path is blocked however it is escaped. A target that could move the call off the
  intended host, or outside the intended path, is rejected before anything is
  sent. An unrecognised service name is answered in a way that cannot be told
  apart from an ordinary failure.
- **FR-7 — No answer names the backing technology.** No body, header or error
  text produced by any route in scope may name the technology behind either
  backend.

## Non-Functional Requirements

- No production code changes. If a route resists testing, that is recorded as a
  finding, not fixed by reshaping the route.
- No test performs real input or output — no network, no counter store, no real
  cookie writes. No test may use a real backend address.
- Lifting or adding a stand-in must be local to the file that needs it. Every
  other test file keeps the run-wide stand-ins exactly as they are today.
- Assertions are about each route's **own** decisions. The helpers these routes
  lean on are already covered by earlier tickets and are not re-proven here.
- The unit suite and the type check both keep passing. Validation profile:
  `logic-change`.
- Every artifact and comment is written in plain English.

## Constraints

- The routes in scope sit under a path the testing convention treats as
  protected, so their tests go in the mirror location, the protected path is
  named in the plan, and the statement is carried at verify.
- Some work in the teardown route is deferred until after the answer is sent. If
  that deferred work cannot be observed without changing the route, the gap is
  recorded as a finding rather than worked around.
- The test environment supplies no backend address of any kind today. The tests
  must provide their own, and every one of them must be an address that cannot
  resolve anywhere.
- Two routes register a guest against the same backend path with different
  surrounding behaviour. They are proven separately; neither stands in as
  evidence for the other.

## Edge Cases

- A verification reply that carries no token pair at all — the legacy branch:
  nothing may be written and the reply passes through untouched.
- A verification the backend refuses: its status and body pass through, and
  nothing is stored.
- A verification called without an identifier or without a code.
- Each of the four sub-services failing on its own, and more than one failing at
  once, while sign-in still succeeds.
- A backend placeholder name arriving where the shopper's name belongs.
- A logout already in progress when a recovery, an expiry or a registration
  arrives.
- A guest registration that answers success but carries no token.
- A scoped clearing request naming something outside the allowed list.
- A profile update whose value is empty, or names a profile that may not be
  updated.
- A recovery call with no body at all, and one naming a service that cannot be
  recovered here.
- A wallet credential read when nothing is stored.
- An OTP send path disguised by percent-escaping, and a target whose escaping is
  malformed.
- A target that starts with two slashes, with a slash and a backslash, or with no
  leading slash at all.
- A target that stays on the right host but climbs out of the intended path.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Deferred. How the criteria below are grouped into files is an approach decision, and the criteria do not depend on it. The scope-level rule is only that every route in scope is covered and that the two guest-registration routes are proven separately (a constraint above). | Open Questions, `/plan` |
| OQ-2 | Deferred as a technique, answered as a rule: the tests supply their own backend addresses, and every one must be an address that cannot resolve anywhere. Whether those values are pinned per file or shared is a plan decision, and the plan must say which shared files it touches. | Constraints, Open Questions, `/plan` |
| OQ-3 | Deferred. How the outgoing call is stood in does not change any criterion below; every criterion is written in terms of what the route decides, not how the call was intercepted. The rule it must satisfy is already a non-functional requirement: no real input or output. | Open Questions, `/plan` |
| OQ-4 | In scope, stated as behaviour: the deferred detach must be prepared only while the credentials it needs are still readable, and a failure in it must never change the logout answer. If the deferred call cannot be observed at all without reshaping the route, that is recorded as a finding — the route is not changed to make it testable. | FR-3, AC-20, Constraints |
| OQ-5 | Answered from the code, not from the live roadmap. The sign-in route stores each credential **only when the backend actually returned one**, so the count varies with what the sub-services answered. "About ten cookies" is a ceiling, not a fixed number, and no criterion asserts a total. What is asserted is which credential is stored for which answer, and that a sub-service that failed stores nothing for itself. | FR-1, AC-1, AC-2 |
| OQ-6 | In scope, by the owner's decision. Every response produced by a route in scope is checked, across body, headers and error text. | FR-7, AC-36 |
| OQ-7 | In scope, by the owner's decision. Beyond the OTP send refusal, the proxy's host guard, its path guard and its deliberate masking of an unknown service name are all covered. The live suite will never cover these — probing for them there would look like an attack — so this is the only place they can be proven. | FR-6, AC-31..AC-35 |
| OQ-8 | Answered. The plan and the verify record carry the protected-path statement required by the testing convention, naming that convention's list. The plugin's own protected-path rule is about a runtime this repository does not have, and the statement says so rather than claiming a rule that does not apply. | NFR, Constraints |

## Open Questions

- **OQ-1** — how the criteria are grouped into test files. Deferred to `/plan`.
- **OQ-2** — whether the backend addresses are pinned per file or shared, and
  which shared files that touches. Deferred to `/plan`.
- **OQ-3** — how each route's outgoing call is stood in. Deferred to `/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | After a successful verification the market credential pair is stored, and neither credential appears anywhere in the answer. | FR-1 |
| AC-2 | A sub-service credential is stored only when that sub-service returned one; a sub-service that failed stores nothing for itself and does not stop the others. | FR-1 |
| AC-3 | Renewal credentials are stored with the long rotating lifetime, never with the short access lifetime. | FR-1 |
| AC-4 | When the verification reply carries no credential pair, nothing at all is stored and the reply passes through unchanged. | FR-1 |
| AC-5 | A sub-service failure is both reported to the caller and recorded for support, while the sign-in still succeeds. | FR-1 |
| AC-6 | A backend placeholder name is not passed on as the shopper's name. | FR-1 |
| AC-7 | A verification the backend refuses passes its status and its body through, and stores nothing. | FR-1 |
| AC-8 | A verification called without an identifier or without a code is refused before the backend is called. | FR-1 |
| AC-9 | While a logout is in progress, the recovery route exchanges nothing and says so. | FR-2 |
| AC-10 | A recovery call naming a service that cannot be recovered here is answered as not eligible, with no exchange. | FR-2 |
| AC-11 | A recovery call with no body performs no exchange. | FR-2 |
| AC-12 | Each exchange outcome maps to its own answer, and no answer carries credential material. | FR-2 |
| AC-13 | While a logout is in progress, the expiry route registers no guest and writes no identity. | FR-2 |
| AC-14 | When a renewal credential is present and the exchange succeeds, the session is renewed and nothing is cleared. | FR-2 |
| AC-15 | When the exchange fails, the whole dead session is cleared — the market pair and every sub-service credential and profile — before a fresh guest is registered. | FR-2 |
| AC-16 | The expiry answer says whether the session being cleared belonged to a verified shopper, read before the clearing happens. | FR-2 |
| AC-17 | When guest registration fails, the stored profile is left marked unverified and no fresh credential is written. | FR-2 |
| AC-18 | Logout deletes every name on the cleanup list, including the legacy one, and the two cookies that are deliberately never cleared survive it. | FR-3 |
| AC-19 | The logout guard is armed after the deletions, is hidden from the browser, and expires on its own. | FR-3 |
| AC-20 | Deferred detach work is prepared only while the credentials it needs are still readable, and a failure in it never changes the logout answer. | FR-3 |
| AC-21 | Scoped clearing clears only names on the allowed list; anything else is ignored and reported as not cleared. | FR-3 |
| AC-22 | Clearing one service's credential marks only that service as needing re-authentication; the other profiles are left untouched. | FR-3 |
| AC-23 | While a logout is in progress, no guest is registered. | FR-4 |
| AC-24 | A new guest credential replaces the previous identity: every sub-service credential and profile is cleared in the same answer. | FR-4 |
| AC-25 | A registration that answers success without a credential clears nothing. | FR-4 |
| AC-26 | The registration answer carries neither credential of the pair. | FR-4 |
| AC-27 | The identity read returns the stored profile and is never cached. | FR-5 |
| AC-28 | The wallet credential read refuses with an unauthorised status when nothing is stored. | FR-5 |
| AC-29 | Only profiles on the allowed list can be updated, and an update merges with what is already stored. | FR-5 |
| AC-30 | When an update carries a fresh pair, both parts are taken from the incoming payload, so a freshly rotated pair is never overwritten by a stale stored one. | FR-5 |
| AC-31 | A call aimed at the OTP send path is refused, including when the path is percent-escaped, and the backend is never called. | FR-6 |
| AC-32 | A target that could move the call to another host is refused before anything is sent. | FR-6 |
| AC-33 | A target that stays on the host but resolves outside the intended path is refused before anything is sent. | FR-6 |
| AC-34 | An unrecognised service name is answered exactly as an ordinary failure, so the two cannot be told apart. | FR-6 |
| AC-35 | The answer states which of the two storefront backends served the call, by its role name. | FR-6 |
| AC-36 | No body, header or error text from any route in scope names the technology behind either backend. | FR-7 |
| AC-37 | No test added by this ticket performs real input or output, and the run-wide stand-ins are still in force for every other test file. | NFR |
| AC-38 | No production code is changed; anything that resisted testing is written down as a finding instead. | NFR |

## Out of Scope

- Any change to production code, including any refactor that would make a route
  easier to test.
- The cookie-forging route. It is not in this phase's list, the live harness
  depends on it, and it carries a security finding of its own — it gets its own
  ticket.
- Re-proving the helpers these routes use. Credential shape, lifetimes, backend
  routing and the renewal exchange are covered by earlier tickets.
- The sign-in screens. They are a separate phase.
- Proving any of this against the real backend. That is the live suite's job, and
  this ticket is what makes its results readable.
- Any change to how sign-in, logout or the proxy behaves for a real user.
- Any change to coverage settings or to a coverage target.
