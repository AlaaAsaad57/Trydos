---
ticket: unit-tests-otp-send-and-limiter
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Review — unit-tests-otp-send-and-limiter

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

This is the gate's record against **plan revision 4**, and the decision that
governs the ticket. It supersedes the records against revisions 1 and 3;
`comprehension.md` keeps the full history of all five gate attempts.

## Review Scope

`spec.md` (19 acceptance criteria over four functional requirements) and `plan.md`
**revision 4** (approach, six steps, seven files, integration surface, validation
profile, two-level rollback). The advisory panel re-ran in full and, beyond the
artifacts, read the two modules under test, the test setup and its stand-ins, the
suite configuration, six existing test files, the project configuration, and the
unauthenticated cache-clearing route. Nothing was implemented and no branch was
created at this gate (RV-9).

`RV-3` checks pass: `plan.md` satisfies PL-1..PL-5, carries an explicit
**Integration surface** (PL-11), leaves no `OQ-n` open (PL-12 — all five were
answered at spec), and every step and file names the criteria it serves.

## Plan Summary

Test each of the two modules for real, in its own file, by lifting only that
module's run-wide stand-in there and naming every module stood in around it, in
registration order. Correct the shared limiter stand-in first, together with the
guard test that pins its old reply. Record the two findings the ticket refuses to
fix, then the roadmap entries and the unit/live boundary. No production code
changes; profile `logic-change`.

Four revisions got here. Revision 2 named the stand-ins; revision 3 fixed the
false-green paths (`AC-11`'s unreachable branch, the fake client's missing script
call, the machine-dependent limits) and added a configuration change; revision 4
**removed** that configuration change and closed the remaining gaps. The plan is
now smaller than revision 3 and materially more precise than revision 1.

## Risks

- **The one unbounded path.** If the client stand-in is mis-registered, the module
  builds a real client from whatever cache credentials the process carries, and the
  limiter cases would run the script for real against live counters. The plan
  accepts a *hang*; the panel showed the real exposure is credentialed writes. The
  mitigation is two lines in a file that does not exist yet, and it is an
  obligation of implementation (see Panel Findings S1 and the note below).
- The abuse boundary this ticket pins can be reset today by anyone through an
  unauthenticated route. The tests are green either way, and that is the
  misreading to guard against.
- Two mechanisms have no precedent in this suite: lifting a stand-in registered in
  the shared setup file, and importing a server-action module for real. Both are
  proven by assertion before either test file is written.
- The shared stand-in is loaded by every test file in the suite, so a mistake there
  reads as a broken harness rather than a ticket-scoped error.

## Assumptions

- Lifting a setup-registered stand-in is documented, hoisted and file-scoped.
  Proven first, not planned around; `vi.importActual` has precedent in this suite
  if it misbehaves.
- Nothing depends on the limiter stand-in's drifted reply except the guard test —
  **verified by the panel**: `{ blocked: false }` is asserted in exactly one place.
- The two roadmap files are documentation with no reader that parses them.

## Open Questions

None. Every `OQ-n` from `research.md` was answered in `spec.md` (PL-12 / RV-3).

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run at
> Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

The senior lens recorded **no blocking item and no major** ("safe to implement"),
the performance lens **no major**, and the security lens two. Findings resolved by
revision 4 and not repeated here: the pinned-credential major (removed with the
file), the backend-address half, the single-evaluation claim, the tripwire wording,
the action's own lift, the leaking single-use reply, the machine-dependent cooldown
in the action test, the global client clear, the documentation-range addresses, the
Validation-strategy contradiction, and the unequal treatment of the two refused
findings.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| security | major | **S1.** The residual risk is understated. The suite's env block only *adds* keys, so a shell or CI holding real cache credentials means a mis-registered stand-in builds a **real client with real credentials**, and the limiter cases then run the script for real — `SADD` / `INCR` / `SET` / `EXPIRE` against live counters. Accept the hang; bound the credential path by unsetting those three values at the top of the limiter test and restoring them in teardown. | `plan.md > Files to change` ("Removed from scope"), `Integration surface`; AC-16 | **Accept — obligation of implementation.** Two lines inside a file the plan already declares, using the stub-and-restore pattern the plan uses twice elsewhere. Recorded here as binding on the limiter test's implementation; see the note under Decision. |
| security | major | **S2.** Deferring the cache-clearing route's fix out of a test ticket is right, but deferring it to a slug that exists only as a word in a plan is not. The route has four defects, not one: no authentication, wildcard cross-origin, a dead method check inside the handler, and an unauthenticated cache purge. A platform firewall rule blocking it is available now at **zero code change**. | `plan.md > Out of scope`, Step 4 | **Accept.** The follow-up ticket is created for real, its finding entry names all four defects, and the firewall rule is raised as the immediate containment — it changes no code, so it breaches nothing here. The code fix stays out of this ticket. |
| performance | minor | The module reads a cached client from the global object before constructing one, so **pre-seeding that global with the fake client** prevents construction even if the stand-in is missing or late — a second, independent line of defence the plan does not use. | `plan.md > Steps` §2 | **Accept — obligation of implementation.** Applied alongside S1. Confirmed against the module: it reads the global cache first and only then constructs. |
| performance | minor | The `AC-11` block clears that same global cache, so the one place a fresh client could still be built is exactly the block that re-imports. The order must be: clear → stub the marker → re-import → restore the marker → re-seed the fake client. | `plan.md > Steps` §2, `AC-11` paragraph | **Accept — obligation of implementation.** The ordering is followed as stated. |
| security | minor | The global cache is assigned on **every** non-edge evaluation, including the file's top-level import, and it outlives the module registry — so the limiter file must clear it in its own teardown, not only inside the `AC-11` block. | `plan.md > Steps` §2 | **Accept — obligation of implementation.** |
| senior | minor | `AC-14`'s fallback lock time still comes from the machine: the wrapper reads the cooldown from the environment when no argument is given, and only the `AC-15` case unsets it. Pass the cooldown explicitly in that one case, or stub and restore it. | `plan.md > Steps` §2, AC-14 | **Accept — obligation of implementation.** Passing it explicitly does not bypass what `AC-14` proves, since the criterion is about the fallback, not about the read. The lens itself called this "not a plan defect worth another gate round". |
| security | minor | Writing the exploitable route's exact path into a committed test comment turns a source comment into a how-to. | `plan.md > Steps` §2 (fail-open comment) | **Accept — obligation of implementation.** The comment states the behaviour and the ticket slug; the concrete path lives in `verify.md > findings` and the tracker only. |
| security | minor | Address fixtures are restricted to the documentation ranges, but no equivalent rule covers the phone fixtures the action test needs. | `plan.md > Steps` §3; AC-2, AC-4, AC-9 | **Accept — obligation of implementation.** Reserved, clearly non-routable test numbers only. |
| performance | minor | The Validation strategy reads as two full passes over the suite; take the summary from the same coverage-enabled run instead. | `plan.md > Validation strategy`, Step 6 | **Accept — obligation of implementation.** One run, summary read from it. |
| performance | minor | A per-file timeout is the weaker bound and does not close a leaked socket; prefer the global pre-seed and the credential unset. | `plan.md > Steps` §2 | **Accept as guidance.** No timeout is added; the two stronger measures are taken instead. |
| senior | info | The registration list claims to name every module stood in around the action, but two constant-carrying modules are left real on purpose. | `plan.md > Steps` §3 | **Accept — noted at implementation.** They are loaded real deliberately; nothing about them reaches a network or a cookie. |
| senior | info | The Rollback claim and Step 3's teardown wording can be read two ways — whether a persistent default is ever set. | `plan.md > Rollback` vs `Steps` §3 | **Accept — one reading.** Every limiter-reaching case sets its own reply; the teardown restore is belt-and-braces, so the Rollback claim holds. |
| senior | info | The guard test's name and comment also become false when its assertion is corrected. | `plan.md > Files to change` | **Accept — folded into the same edit.** |
| senior | info | Two mechanisms are unproven in this suite, not one: the lift, and importing a server-action module for real. | `plan.md > Approach` | **Accept.** The first-minutes assertion covers both. |
| security | info | The backend address stub should use the suite's reserved-domain convention. | `plan.md > Steps` §3 | **Accept — obligation of implementation.** |
| senior, security | info | The plan's factual claims were checked against the repo — the `AC-11` premise, `AC-15`'s "no re-load needed", the single consumer of the drifted reply, and that coverage will move off zero. All hold. | `plan.md` throughout | **Dismiss — no action.** Recorded because it is the useful half of a review: the plan's assertions were verified, not assumed. |
| security | info | No `observability/**` in this repository and none touched; no protected runtime path touched; no secret appears in plan or spec; rollback is a revert with a stated lockstep pair. | `plan.md > Files to change`, Rollback | **Dismiss — no action.** |

## Decision

`APPROVED`

- Rationale: the approach was never in question and is now specified precisely
  enough to implement without improvising. The senior lens — the one whose job is
  to ask whether this fits the system and is the smallest change that reaches the
  criteria — records no blocking item and verified the plan's factual claims
  against the repository rather than taking them on trust. The performance lens
  records no major. Revision 4 is smaller than revision 3, because the right answer
  to the previous round's major was to delete the scope that caused it. What
  remains is one security major and a set of minors, all of which are single lines
  inside files that do not exist yet, and all of which are accepted rather than
  dismissed.
- **The condition attached to this approval.** `S1` and the accepted minors are
  recorded above as *obligations of implementation*, not as blocking follow-ups.
  They are binding: the limiter test unsets the three cache credentials and
  restores them, pre-seeds and finally clears the module's global client cache, and
  orders the `AC-11` block as the panel set out. If `/wf:implement` treats any of
  these as undeclared work — it is contractually bound to `plan.md`, and `plan.md`
  names the files but not these details — the correct response is to stop and take
  a `/wf:plan` revision, **not** to skip them. That is the known weakness of
  approving here rather than revising once more, and it is written down so it
  cannot be quietly lost.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-review (ADR-009). Comprehension gate passed
  5/5 against revision 4 (`comprehension.md > Review gate > Attempt 5`).

## ADR reference

- ADR: none

## Required Follow-up Actions

None — implementation may begin. The accepted panel items are obligations of
implementation, recorded in **Panel Findings** above and summarised in the
Decision; they do not block the start of work.

Two separate tickets are to be created, and neither is part of this one:

- `secure-clear-redis-route` — the unauthenticated cache-clearing route, all four
  defects. **Raise the platform firewall rule as immediate containment**; it
  requires no code change.
- `otp-phone-length-upper-bound` — the number guard's missing upper bound.
