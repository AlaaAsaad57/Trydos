---
ticket: unit-tests-authed-fetch-and-tokens
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Review — unit-tests-authed-fetch-and-tokens

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Round 2.** Round 1 recorded `CHANGES_REQUESTED` against plan revision 1 with
eight required follow-ups. Revision 2 addressed all eight; the panel confirmed
every round-1 `major` resolved and raised six new ones. This round records
`APPROVED`, with the six new majors carried forward as **binding obligations on
implement** rather than plan text.

## Review Scope

`spec.md` (14 functional requirements, 20 acceptance criteria) and `plan.md`
revision 2 (approach, 10 steps, 5 files, integration surface, validation
strategy, rollback). The advisory panel read those plus the five modules under
test, the failure reporters, the test harness and the runner settings.
Comprehension check: 9 new questions, passed 9/9 (attempt 1 also 9/9).

## Plan Summary

Test the five files from the outside at the seams they already have, faking only
the framework's request store, the network and the failure reporter. Extend the
shared request-store stand-in so it accepts the object form of a cookie write,
records the options, resets between tests, and can refuse writes. Stand in the
refresh exchange (later ticket) and the failure reporter (reaches Sentry and
fires its own outbound request). Where the code is untestable or wrong, pin
today's behaviour and record the defect (AC-20).

## Risks

- **Six known defects enter implementation unfixed.** This is a deliberate
  decision, not an oversight. Four are plan-text corrections implement must make
  as it goes; two are technical unknowns implement must probe.
- **Implement will deviate from the approved plan.** IM-3 expects implement to
  apply only what the plan declares. Here it must widen the reporter stand-in
  beyond what the plan says and change the stub host values. Each deviation must
  be recorded in `implement.md`.
- **One escape route is not enforced by the harness.** The reporter's outbound
  call is unawaited and double-swallowed, so the fake network cannot fail a test
  on it, and it can fire after the fake network has stopped.
- **Two criteria may prove hollow.** If the cookie module's request reader
  resolves to nothing under the server-style environment, AC-13 and AC-14 assert
  constants only. That must be reported, not hidden.
- The stand-in being extended shapes cookie testing for five later tickets in
  this journey while having no callers today to constrain it.

## Assumptions

- The harness from roadmap phases 1–3 is sound and is reused, not replaced.
- The shared setup file tolerates the server-style environment. If it does not,
  implement stops and re-plans rather than editing it.
- The refresh exchange is covered by its own ticket and is not owed here.
- No file outside `tests/` is created or modified.
- Neither source area is a protected runtime path (settled at spec, OQ-1).

## Open Questions

- None outstanding. All ten research questions are answered across `spec.md` and
  `plan.md` (PL-12 satisfied). The obligations below are corrections and probes,
  not open questions.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

### Round-1 majors — all confirmed resolved

| Round-1 major | Verdict | Confirmed by |
|---|---|---|
| Backend addresses absent, so routing branches indistinguishable (AC-18) | **Resolved.** The addresses are read at call time, so a file-local stub works without touching shared settings. | senior, performance |
| Unparseable register-guest address rejected before the fake network | **Resolved.** A parseable stub means one reply instead of a rejection burning three attempts. | senior, performance |
| Failure reporter missing from the Integration surface | **Resolved** for the reporter module; **incomplete** in scope — see N-1, N-3. | senior, security |
| Reporter copies raw credentials into every report | **Resolved as a recorded finding** (finding 4 of 6, AC-20). | security |
| AC-15's environment branch frozen at module load | **Resolved** in mechanism. | senior, security |
| Timing claim wrong; simulated clock would deadlock | **Resolved** in substance — see N-5 on the seam. | performance |
| AC-12 / memoisation module removed | **Resolved.** Removes the one test that had no honest assertion. | senior, performance |

### Round-2 findings

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| senior | major (N-1) | A **second** failure reporter is missing: `LogError` from `utils/functions`, called in the authed layer's catch on AC-9 and AC-10. It drags the store and its nine reducers into a server-only test file, surviving only because of setup-file mocks the plan claims not to depend on. | `plan.md > Integration surface`, steps 3–4 | **Accept, deferred to implement.** Obligation 1. |
| senior | major (N-2) | Resetting modules in step 7 re-runs the stand-in factory and yields a new instance, orphaning the cookie jar and spies that AC-16..AC-19 hold in the same file. | `plan.md` steps 7–8 | **Accept, deferred to implement.** Obligation 4. |
| security | major (N-3) | The reporter stand-in is scoped to AC-11 in prose, but the reporter is reachable from AC-3..AC-10 (every 401 passes the transport layer's non-OK branch) and AC-19's masking path. | `plan.md` step 5, Integration surface | **Accept, deferred to implement.** Obligation 1. |
| security | major (N-4) | The two round-1 fixes together make the escape *more* reachable: a well-formed address plus the server-style environment removing the browser guard means the outbound log POST is genuinely sent, unawaited, possibly after the fake network stops. | `plan.md` OQ-7/FU-1 note, Validation strategy | **Accept, deferred to implement.** Obligation 2 — use non-routable `.invalid` hosts. |
| performance | major (N-5) | "Watch the delay function" names a seam that does not exist — the backoff helper is a private closure. The only seam is the global timer, and spying without short-circuiting still waits real time, breaking the determinism rule. | `plan.md` step 5, Validation strategy | **Accept, deferred to implement.** Obligation 3. |
| performance | major (N-6) | Under the server-style environment the cookie module's guarded `require` of the framework request reader actually runs. It will either resolve to nothing — leaving every server-side cookie helper silently doing nothing while tests pass — or load the real module, which the stand-in cannot intercept. | `plan.md` Validation strategy, step 6 | **Accept, deferred to implement.** Obligation 5 — probe first, with a stop rule. |
| senior | minor | The 48-hour lifetime assertion risks becoming unfalsifiable if the override is stubbed to a value — the same failure mode round 1 raised. | `plan.md` step 7; AC-15 | **Accept.** Folded into obligation 4. |
| senior | minor | The partial token-module replacement is unnecessary: verified state and the cookie writes are drivable from the extended stand-in alone, which asserts real writes instead of spies. | `plan.md` Approach, step 3 | **Accept.** Folded into obligation 4. |
| senior | minor | The cookie module's test file is nearly empty once the browser-only helpers are out of scope, and an existing test already pins part of the same contract. | `plan.md` step 6 | **Accept.** Folded into obligation 5 — decide after the probe. |
| senior | minor | Spec drift is wider than stated: removing AC-12 orphans FR-7 and contradicts the spec's own OQ-10 answer. | `plan.md` FU-8 note; `spec.md` FR-7, OQ-10 | **Accept.** Obligation 6. |
| senior | minor | The memoisation module is left with no owner — the roadmap still assigns it to this phase, and the reassignment lives only in `plan.md`. | `plan.md` FU-8 note | **Accept.** Obligation 6. |
| security | minor | Asserting list membership does not prove any cookie was written unreadable-by-browser; a write bypassing the helper stays green. | AC-14 | **Accept.** Folded into obligation 4 — assert the recorded write options. |
| security | minor | The plan does not say the environment stub and module registry are restored after the production-branch test; a leak would mis-pin AC-15's other branch and AC-18. | `plan.md` step 7 | **Accept.** Folded into obligation 4. |
| security | minor | The findings describe live credential-leak paths and land in a committed artifact. | AC-20; NFR "Quiet" | **Accept.** Obligation 7 — record by file, line and payload shape only. |
| security, performance | minor | The server-style environment change could break the shared setup file, whose cheapest fix would be editing it — which the plan forbids. | `plan.md` Validation strategy | **Accept.** Folded into obligation 5's stop rule. |
| performance | minor | The five-second limit applies per test, not per file, and hooks carry their own default. | `plan.md` Validation strategy | **Accept.** Folded into obligation 3. |
| performance | minor | The fake network's unhandled-request rule cannot fail fast for anything behind the transport layer — a missing reply is retried three times and surfaces as a confusing assertion, not a clean failure. | `plan.md` Integration surface | **Accept.** Folded into obligation 3. |
| senior | info | Making a profile read fail is the only way to reach AC-17's failure branch; decode failures are swallowed and return the raw value. | AC-17 | **Accept.** Note the seam at implement so the criterion is not written as a no-op. |
| senior, security, performance | info | No protected runtime path is touched, the helper genuinely has no callers, and the rollback is real. The environment change is also a net saving. | `plan.md` Rollback | **Accept.** No action. |

## Decision

`APPROVED`

- Rationale: the approach is sound and every round-1 `major` is confirmed fixed
  by all three lenses. The six new findings are real but none of them changes the
  approach: four are corrections implement can make while writing the files, and
  two are unknowns that can only be settled by running the code — a further plan
  revision would be guessing at them on paper. The owner weighed the cost of a
  third review round against the cost of recording the six as binding obligations
  and chose the latter. The comprehension check passed 9/9 on questions drawn
  from these findings, including the deviation consequence itself, so the
  decision is informed rather than a rubber stamp. **The trade-off is stated
  plainly: implement will deviate from the approved plan on the reporter scope
  and the stub host values, and must record every deviation in `implement.md`.**

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-review, comprehension check passed 9/9 on
  new questions (floor of 3 including the mandatory integration question, plus
  one per round-2 `major`).

## ADR reference

- ADR: none

## Required Follow-up Actions

**These are binding on `/wf:implement`.** They were accepted at the gate instead
of being written into `plan.md`, so implement must apply them and record each as
a deviation (IM-3).

1. **Stand in both failure reporters, everywhere they are reachable** (N-1, N-3).
   `utils/serverErrorReporter` in all three server-side files, not only the
   transport test — AC-3..AC-10 and AC-19 reach it too. Add `LogError` from
   `utils/functions`, called on the authed layer's catch path, and state whether
   it is stood in or relied on as inert, with the reason.
2. **Use non-routable hosts for the file-local address stubs** (N-4). Reserved
   `.invalid` names, not a real-looking domain, so an escaped request cannot
   leave the machine even if a stand-in is missing.
3. **Fix the delay seam and the limits** (N-5). The seam is the global timer, and
   the spy must record the delay and invoke the callback immediately rather than
   waiting. Pass an explicit retry count and zero delay on tests where retrying
   is not the thing under test. Set both the test limit and the hook limit.
4. **Isolate the module-reset test** (N-2). Put the production-branch assertions
   in their own file, or re-acquire the stand-in after every reset. Restore the
   environment stub and module registry afterwards. Leave the lifetime override
   unset for the 48-hour case so that branch is genuinely proved. Drop the
   partial token-module replacement and drive verified state from the stand-in.
   Assert the recorded write options, not only list membership.
5. **Probe the server-style environment before writing the cookie files** (N-6).
   Confirm one server-side cookie write actually reaches the stand-in. If it does
   not, record it as a finding and state which criteria it hollows out. **Stop
   rule:** if a file cannot run under the shared setup, stop and re-plan — do not
   edit the shared setup file.
6. **Record the spec drift honestly.** FR-7 and the spec's OQ-10 answer move out
   alongside AC-12, and the memoisation module's reassignment must be written
   where the next reader will look, not only in `plan.md`.
7. **Record findings by file, line and payload shape only.** No token, cookie or
   profile value copied from a real session into a committed artifact.
