---
ticket: unit-tests-otp-send-and-limiter
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Spec — unit-tests-otp-send-and-limiter

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit tests for the OTP send action and the rate-limit wrapper.

## Business Goal

The OTP send path is the front door of sign-in and the place where abuse is
refused. Two parts of it have never been executed by a test: the send action,
which decides whether a send is allowed and what the user is told when it is
not, and the rate-limit wrapper, which decides what happens when the counter
store is unreachable. Both are replaced by stand-ins for the whole test run
today, so a change to either — a refusal message, a lock time, a fail-open rule —
reaches staging with nothing to catch it. Covering them means a wrong refusal, a
lost lock time, or a silently closed door is caught before it locks real users
out.

## User Story

> As the owner of this codebase, I want the OTP send action and the rate-limit
> wrapper covered by unit tests, so that a change to how an OTP send is refused,
> counted, or reported is caught before it reaches staging.

## Functional Requirements

- **FR-1 — The send action's own decisions are proven.** Its guard on an
  unusable number, the shape of the number it passes on, its behaviour when the
  limiter refuses, its behaviour on each kind of backend reply, and what it
  reports in each case.
- **FR-2 — The rate-limit wrapper's own decisions are proven.** What it does when
  the counter store is absent or fails, how it names each refusal, what lock time
  it reports, and which limits it applies when none are configured.
- **FR-3 — The shared stand-in for the limiter matches the real result.** A test
  file that does not set its own reply gets a result with the real shape and the
  real meaning, so no test can pass on a value the real code never returns.
- **FR-4 — The testing roadmaps record both files and the boundary between the
  two suites.** The unit roadmap gains an entry for these two files; the live
  roadmap records that the wrapper is now covered here and that the counter
  script itself remains its own.

## Non-Functional Requirements

- No production code changes. If either module resists testing, that is recorded
  as a finding, not fixed by refactoring it.
- No test performs real input or output — no network, no counter store, no real
  cookie writes.
- Lifting a stand-in must be local to the test file that needs it. Every other
  test file keeps the run-wide stand-ins exactly as they are today.
- Both suites keep passing, and the type check keeps passing. Validation profile:
  `logic-change`.
- Every artifact and comment is written in plain English.

## Constraints

- One of the two modules sits under a protected path. Its test must go in the
  mirror location the testing convention requires, the protected path must be
  named in the plan, and the protected-path statement must be carried at verify.
- The send action offers no injection point; every dependency it uses is fixed at
  load time. The tests work with that, they do not change it.
- The real decision inside the limiter is made by a script that runs in the
  counter store, not in application code. A unit test can only prove the code
  around that script.
- The reporting of send attempts is deliberately silent — it does nothing outside
  production and swallows its own errors. A test must not be able to pass merely
  because that silence hid a failure.

## Edge Cases

- A number that is too short, empty, or made only of punctuation.
- A refusal that carries no remaining lock time.
- A backend reply that carries a message but no verification id.
- A backend reply whose message is wrapped inside the transport's error text
  rather than returned as a plain body.
- A verification id delivered in either of the two reply shapes the backend uses.
- The counter store being absent entirely, and the counter store failing
  mid-call. These must behave the same way as each other, and that way is
  **allow**.
- An unexpected failure anywhere in the action: the caller gets a failed result,
  never a thrown error.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Neither existing phase. Phase 8 is closed and phase 10 is about a different subject, so putting these files under either would make the roadmap wrong in a new way. The two files are recorded as their own entry in journey 2, and the existing phase numbers are **not** changed — renumbering would break every reference already written elsewhere. | FR-4, AC-18 |
| OQ-2 | In scope. The shared stand-in's default reply does not have the real result's shape, and against it the real action reads a missing field and refuses every send. Leaving it would let a future test pass on a value the real code never returns. Correcting it is a change to a test stand-in, not to code under test, so it does not breach the no-refactor rule. | FR-3, AC-17 |
| OQ-3 | In scope, stated as behaviour rather than as a technique: the action must be proven to ask the limiter about the very session and address identity it resolved, not merely to have called it. How the identity module is isolated so that no real request is made is a plan decision. | FR-1, AC-10 |
| OQ-4 | The wrapper only, and that includes walking each refusal the script can report, because the naming of those refusals and the lock time reported with them are decided in application code. Proving the script's own counting, windows and atomic behaviour is not in this ticket. | FR-2, AC-13, AC-14, Out of Scope |
| OQ-5 | In scope. The hand-off is recorded in the live roadmap as well, not only in this ticket, so whoever picks up the live phase knows the wrapper is already covered and does not either repeat it or assume the whole limiter is done. | FR-4, AC-19 |

## Open Questions

None. Every `OQ-n` raised at research is answered above; none is deferred to
`/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A send whose number has too few digits is refused, and the limiter is never consulted for it. | FR-1 |
| AC-2 | A number that passes the guard is passed on in the single normalised form, whatever punctuation or spacing it arrived with. | FR-1 |
| AC-3 | When the limiter refuses, the action reports a blocked result carrying the refusal reason and a lock time, and the backend is never called. | FR-1 |
| AC-4 | A cooldown refusal and a cap refusal produce different messages to the user, and both carry the lock time the limiter reported. | FR-1 |
| AC-5 | When the backend returns a verification id, the action reports success with that id and with a lock time. | FR-1 |
| AC-6 | The verification id is found in either of the two reply shapes the backend uses. | FR-1 |
| AC-7 | When the backend returns no verification id, the action reports failure and passes the backend's own message through, including when that message is wrapped inside the transport's error text. | FR-1 |
| AC-8 | An unexpected failure inside the action produces a failed result, not a thrown error. | FR-1 |
| AC-9 | Each of the three outcomes — sent, blocked, failed — is recorded exactly once, under its own outcome name, and a test cannot pass because that recording quietly did nothing. | FR-1 |
| AC-10 | The session and address identity the action resolved is the identity the limiter is asked about. | FR-1 |
| AC-11 | When no counter store is available, the send is allowed. | FR-2 |
| AC-12 | When the counter store fails mid-call, the send is allowed, and the failure is reported rather than swallowed silently. | FR-2 |
| AC-13 | Each refusal the counter script can report maps to its own documented reason name. | FR-2 |
| AC-14 | A refusal that carries no remaining lock time falls back to the configured cooldown, never to zero. | FR-2 |
| AC-15 | The four limits are read from configuration, and the documented defaults apply when nothing is configured. | FR-2 |
| AC-16 | No test added by this ticket performs real input or output, and the run-wide stand-ins are still in force for every other test file. | NFR |
| AC-17 | The shared stand-in for the limiter replies with the real result's shape, and a test that sets no reply of its own gets an allowed result. | FR-3 |
| AC-18 | The unit roadmap records both files under journey 2, and no existing phase number changes. | FR-4 |
| AC-19 | The live roadmap records that the wrapper is covered by unit tests and that the counter script itself stays with the live phase that already owns the limiter. | FR-4 |

## Out of Scope

- Any change to production code, including any refactor that would make either
  module easier to test.
- Proving the counter script itself — its counting, its fixed windows, its
  atomic behaviour under two callers at once. That belongs to the live suite.
- The other untested parts of the sign-in path: the authentication route
  handlers, the proxy's refusal of a direct send, and the sign-in screens. Each
  is its own ticket.
- Any change to how the OTP send behaves for a real user.
- Any change to coverage settings or to the reported coverage target.
