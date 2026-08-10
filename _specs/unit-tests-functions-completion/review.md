---
ticket: unit-tests-functions-completion
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Review — unit-tests-functions-completion

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` and `plan.md` for this ticket, read together with `research.md` and
`intake.md`. For context the gate also looked at the module under test
(`utils/functions.tsx`), the test file being grown (`utils/functions.test.ts`),
the shared test kit (`tests/mocks/`), the runner setup (`vitest.config.mts`), the
conventions (`docs/testing/UNIT_TESTING.md`) and the workflow configuration
(`.claude/project-config.yaml`). Nothing was changed.

## Plan Summary

Grow the single existing test file until all 18 exports of the shared helper
module are covered, one `describe` block per export, in source order. Two setup
changes unlock the rest: keep the runner's own browser stand-in instead of
replacing `window` with a bare object (and reach the server side by deliberately
removing `window` for those few tests), and put every helper that waits on a fake
clock. The module under test is not changed; the places where it misbehaves are
pinned as tests and written up as findings. One source file changes.

## Risks

- **A test that never finishes.** One export can never settle when its flag is
  false at call time. The plan handles it by racing rather than awaiting, plus a
  fake clock. The panel corrected one detail: the runner does have a default
  per-test limit of five seconds, so a stuck test fails rather than hanging. The
  guard is still right; the plan's justification for it was overstated.
- **A timer left running.** The same export never clears its repeating check.
  If cleanup does not clear timers and restore the real clock, something can
  outlive the test and keep the process alive after the tests pass.
- **Order-dependent tests.** The cookie stand-in's jar and the browser's own
  storage are not emptied by resetting modules or clearing mocks, so one test can
  leave state behind for the next.
- **A test that passes for the wrong reason.** A stand-in returning a default
  nobody meant proves nothing. The plan already answers this by asserting how
  many requests were made, not only what came back.
- **The suite is a shared gate.** `pnpm test:run` is the `unit-tests` check
  behind the `tests-and-types` profile, which every later phase of the test
  roadmap runs. A bad test here is felt far outside this ticket.

## Assumptions

- The conventions hold: a testing ticket records findings and never repairs the
  file it tests.
- The shared stand-ins from the earlier phases are good enough as they are, so
  none of them has to change.
- `utils/functions.tsx` is already in the coverage list, so no runner
  configuration changes.
- Everything runs locally; there is no CI to satisfy.

## Open Questions

- None. All seven `OQ-n` from `research.md` are closed — five answered in
  `spec.md` (OQ-1, OQ-2, OQ-3, OQ-4, OQ-6) and two in `plan.md` (OQ-5 in the
  Approach, OQ-7 in the Validation strategy). RV-3 checked this.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

**No `major` findings.** Twelve findings in total: seven `minor`, five `info`.
None required a plan rewrite, so CG-6 added no extra comprehension question.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | State leaks between tests. Neither the cookie stand-in's jar nor the browser's own storage is emptied by resetting modules or clearing mocks, so the compare and search-history tests would pass or fail depending on the order they run in. | plan.md Steps 1, 5, 6; AC-7 | **Accept.** Emptying both in the per-test setup is part of Step 1 as written ("rework the setup"); it is called out here so `/verify` can check it happened. No plan rewrite. |
| senior | minor | AC-11 names the time zone and the formatting locale, but this module reads neither — it uses a plain ISO timestamp, which is always UTC, and builds numbers with plain strings. `/verify` would go looking for something that is not there. | plan.md Step 1, Validation strategy; AC-11 | **Accept.** `implement.md` will state plainly that AC-11 is met by pinning the clock, the language and the page address, and that this module reads no time zone or formatting locale. That satisfies AC-11 without touching the runner configuration. |
| senior | minor | The Integration surface claims `pnpm test:run` has no time limit of its own. That is wrong — the runner defaults to five seconds per test, so a stuck test fails rather than hangs. The worst case is overstated and the extra per-test limits mostly repeat a default. | plan.md Integration surface | **Accept the correction.** The guard itself stands. `implement.md` records the correction, and per-test limits are kept only where they are set well under the default so they add something. |
| senior | info | The rest of the surface checks out: the module is already in the coverage list, the profile and its checks exist, and the shared kit is only read — so the kit's own self-test is unaffected. Keeping the translation stand-in local to this file is the right call. | plan.md Integration surface, Files to change | **Accept.** No action. |
| security | minor | The error-logger tests assert on a whole payload that carries a profile, cookies and a user agent. If someone pastes a payload captured from a real browser into the test file, real data gets committed. | plan.md Step 8; AC-6, FR-6 | **Accept.** The payloads are built from the existing all-fake fixtures and stand-ins. `implement.md` states this. |
| security | info | The protected-path claim was checked and holds. Only `utils/functions.test.ts` and the ticket's own record change; neither is on the protected list. The cookie manager and the shared state are stood in for, which changes no file. | plan.md Files to change; project-config.yaml protected_paths | **Accept.** No action. Confirms GU-2 / IM-5 do not apply here. |
| security | info | No publicly known vulnerability affects the versions actually installed. The reported test-runner file-read flaw is fixed in the installed version, and the browser-mode advisories need a package this repo does not have. Running the suite starts no server. | package.json, pnpm-lock.yaml | **Accept.** No action. |
| security | info | The module under test prints the user's profile cookie to the console on every call, so profile data reaches every shopper's browser console in production. The plan only silences it in tests. | utils/functions.tsx:77; AC-4 | **Accept.** It becomes its own entry in the AC-4 findings list so a repair ticket gets written. Not fixed here — AC-12 forbids touching the module. |
| performance | minor | Register the three translation stand-ins at the top of the test file rather than inside the translation step. Otherwise a fresh reload with a non-English page address re-imports and re-parses roughly 416KB, with no reuse between tests. | plan.md Steps 1 and 4; OQ-4, AC-10 | **Accept.** The stand-ins are registered at the top of the file in Step 1. This also makes AC-10 easier to prove. |
| performance | minor | The never-ending helper leaves a repeating timer behind, and draining it would hit the runner's timer limit. Use the async time-advancing call, never the "run everything" one, and clear timers plus restore the real clock in cleanup. | plan.md Approach, Step 7; AC-9 | **Accept.** This is the concrete shape of what Step 7 already asks for. Recorded so `/verify` can check it. |
| performance | minor | Reloading the module for every one of roughly sixty tests is more than is needed — only the tests that depend on the page address at load time need it. | plan.md Steps 1–8 | **Accept in part.** The fresh reload stays the default because it is the safer, simpler rule and the suite currently runs in about six seconds. If the suite gets slow, narrowing it is a separate change. Recorded so the reason is on the record rather than assumed. |
| performance | info | The real remaining risk is not a hang but an open timer keeping the process alive after the tests pass. | plan.md Integration surface; AC-9 | **Accept.** `/verify` checks that `pnpm test:run` exits on its own, not only that the tests pass. Written into AC-9's evidence. |

## Decision

`APPROVED`

- Rationale: the plan is complete and traceable. It meets PL-1..PL-5 plus PL-11
  (a real Integration surface, not a summary of the steps) and PL-12 (no `OQ-n`
  is left open — OQ-5 and OQ-7 are answered in the plan). Every acceptance
  criterion in `spec.md` has a step behind it, and every step traces back to a
  requirement or an AC. The advisory panel raised no `major` finding; all nine
  findings are `minor` or `info` and are accepted as work inside `/implement`
  rather than reasons to rewrite the plan. The scope is one source file, no
  protected path, and a single-file revert.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval under the single-owner model
  (ADR-011), gated by the comprehension check recorded in `comprehension.md`
  (4 of 4 correct, including the required integration question).

## ADR reference

> Optional — record an ADR only if the decision is notable; otherwise "none".

- ADR: none

## Required Follow-up Actions

- none — nothing has to happen before `/implement` starts. The twelve accepted
  panel findings are handled inside the implementation and are listed above so
  `/verify` can check each one; they are not preconditions.
