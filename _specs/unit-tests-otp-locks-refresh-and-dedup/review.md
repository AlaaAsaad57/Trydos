---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Review — unit-tests-otp-locks-refresh-and-dedup

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (35 acceptance criteria, AC-1..AC-35) and `plan.md` (approach, 8 steps,
8 files, integration surface, validation strategy, rollback), with `research.md`
as context for the ten recorded risks. The advisory panel ran all three lenses
over the same two artifacts. No code was read for the decision beyond what the
panel quoted, and nothing was implemented.

## Plan Summary

Five new test files in the `tests/` mirror — one per module in scope — plus two
pieces of missing harness: an empty stub that makes the `server-only` marker
resolvable in the runner, and a stand-in for the framework's per-request memo
confined to the dedup test file. No module under test is modified. The three
deferred research questions are answered in the plan: all five files go in the
mirror (OQ-1), the dedup helper is tested against a supplied store and the test
says what it therefore cannot prove (OQ-2), and `server-only` is resolved by one
alias in the shared runner config rather than a per-file stand-in (OQ-3).

## Risks

- The `server-only` alias is the only change with reach beyond this ticket. It
  trades a loud import failure for a silent load — the plan names this, and the
  panel raised the same point twice (security minor, performance minor).
- Four of the six major findings are the same class of defect: a test that
  passes without exercising the code it claims to cover. The spec already
  forbids this (NFR-4, AC-31), so these are gaps between the plan's steps and
  the spec's own standard, not disagreements with it.
- The suite gains two hang-shaped risks it does not have today: gated promises
  without an explicit timeout, and fake timers around an intercepted request.
- Coverage of five modules in one ticket keeps the scope wide; the ticket stays
  whole by decision (OQ-6), so the risk is schedule, not correctness.

## Assumptions

- The framework's per-request memo works; only our helper is under test.
- `vitest.config.mts` is not a protected runtime path, so a one-line alias there
  is a normal change, not a protected-path event.
- The existing harness (request-reader stand-in, fake network, cache stand-in,
  gated-fetch pattern) is sufficient; no new shared helper is needed.
- Nothing in the current test graph imports the other `server-only` module, and
  its initialisation is lazy — checked, not assumed.

## Open Questions

None. `research.md` raised OQ-1..OQ-8; `spec.md` answered five and deferred
three; `plan.md` answers those three (PL-12 satisfied). No question is still open
at this gate.

## Panel Findings (advisory)

> Advisory only (RP-2): these inform the owner and never block the decision. Each
> `major` seeded one comprehension question (CG-6) — all nine were answered
> correctly.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | major | Base URLs are unset in the runner, so the exchange builds a relative URL, `fetch` throws, and the helper's own catch returns `unavailable` — AC-20 passes against a module that did nothing. | plan step 5; AC-18..AC-20 | **Mitigate** — FU-1. Stub all four base URLs to reserved unresolvable hosts and assert the recorded call, not only the returned status. |
| senior | major | The runner's `env` block decides the telemetry answer: the analytics key is `''` and the environment is not production, so AC-15's two silence assertions hold by default. The block is missing from the Integration surface. | plan Integration surface; AC-15..AC-17 | **Mitigate** — FU-2. Write the recording path first, stub both values per test, and add the `env` block to the surface at implement time. |
| security | major | Nothing requires fixtures to be synthetic; the five files hand-write tokens, refresh credentials, profiles and an analytics key, and no AC forbids pasting a real one. A committed credential is permanent. | AC-31 / NFR-1; plan steps 3–5 | **Mitigate** — FU-3. Binding rule: every credential-shaped value is obviously fake and self-describing; checked by inspection at `/verify` alongside AC-34. |
| security | major | The deferred telemetry callback can settle after the fake network closes in `afterAll`, firing a real POST to the hardcoded analytics host — and the recorder swallows the error, so the test still passes. | plan step 4; AC-17 / AC-31 | **Mitigate** — FU-4. The stand-in collects callbacks and flushes them inside the test body; `fetch` is stubbed at module level rather than relying on the fake network as the only backstop. |
| performance | major | Gated single-flight tests can hang: no explicit timeout is set, unlike the existing authed-fetch suite which sets one precisely for this reason. | plan step 5; AC-26 / AC-27 | **Mitigate** — FU-5. Explicit test and hook timeouts at the top of the refresh and dedup files; every gate released in `afterEach`. |
| performance | major | Fake timers plus a promise that only settles on a timer is a whole-run stall — the fake network starts for every file and uses timers internally, and there is no global timeout. | plan steps 2 and 5 | **Mitigate** — FU-6. Never leave fake timers installed across an awaited network stub; real timers restored in `afterEach`. |
| senior | minor | `tests/stubs/` opens a fourth location for stand-ins; the setup file states in writing that such helpers belong in `tests/mocks/`. | plan Files to change | **Accept** — FU-7. Move the stub to `tests/mocks/`; no new folder for one file. |
| senior | minor | Mirror-path shape is inconsistent: the existing token-manager test flattens `utils/server/`, the plan nests it — two shapes in one folder, the exact findability problem the placement decision argues against. | plan Files to change | **Accept** — FU-8. Keep the nested shape, and say in `implement.md` that the existing flattened file is the odd one out. |
| senior | minor | A separate ticket for what is a three-line doc edit is more process than the fix, and the same doc is stale in a second place (the coverage rule). Until it lands, the next phase writer follows the written rule. | plan Approach bullet 1 / Out of scope | **Dismiss, with reason** — the small-change rule cuts both ways: editing the conventions doc mid-testing-ticket widens the diff and mixes two concerns. The finding stands as a recorded finding; the doc ticket is cheap to open. |
| senior | minor | Rollback is only clean while this ticket stands alone — the alias is shared harness the next phases build on. | plan Rollback | **Accept** — FU-9. State in `implement.md` that the alias survives a revert of the test files. |
| security | minor | Only step 3 commits to reserved hosts; step 5 never says where the base URLs come from, and the shared config points the chat address at a real domain. | plan steps 3 and 5 | **Accept** — folded into FU-1. |
| security | minor | The `server-only` stub could throw when a browser-like environment imports it, keeping the boundary loud where it matters instead of silent everywhere. | plan Approach bullet 3 | **Accept** — FU-10. Make the stub conditional rather than empty; it costs one line and preserves the signal the alias removes. |
| security | minor | AC-19 pins "an upstream rejection leaves the stored credential in place" as correct; once three call sites assert it, removing it later looks like a regression. | AC-19 | **Accept** — FU-11. Pin it as a characterization test with a recorded finding, the same treatment AC-30 gets. |
| security | minor | The limiter identity is an unsalted, truncated hash over IP and session id, and pinning it locks in both a brute-forceable hash of personal data and the evasion budget a larger prefix holder gets. | AC-8 / AC-9 | **Accept** — FU-12. Record as a finding so a later salt or width change is a decision, not a test failure. |
| security | minor | AC-16 pins that the raw client address is exported to a third-party analytics processor; a passing test becomes the argument that this is intended. | AC-16 | **Accept** — FU-12. Recorded as a privacy decision nobody has signed off. Not fixed here. |
| security | minor | AC-30's no-eviction finding should name both consequences — failure stickiness and unbounded key growth — and say whether the key is attacker-influenced. | AC-30 | **Accept** — FU-13. Scope the follow-up ticket properly. |
| performance | minor | Resetting the module registry before every refresh test re-parses a 415-line module and its whole graph for ~25 tests, mostly unnecessarily. | plan step 5 | **Accept** — FU-14. Reset only where a flight is left un-settled; the ladder tests share one import. |
| performance | minor | Releasing a gated promise with a rejection after the test body returns surfaces as an unhandled rejection failing a later, unrelated test. | plan step 5; AC-32 | **Accept** — folded into FU-5. |
| performance | minor | The alias lets a browser-environment file pull a server module's whole graph; the four server files should be pinned to the server-like environment. | plan Files to change | **Accept** — already the plan's intent; made explicit in FU-10. |
| performance | minor | AC-32 is validated by running the suite twice, which doubles wall-clock without catching ordering leakage. | plan Validation strategy | **Accept** — FU-15. Run the second pass with a randomised sequence instead of a plain repeat. |
| senior | info | AC-35 is answerable by reading — the outcome vocabulary already matches the existing stand-in, so step 7 is a confirmation, not work. | plan step 7 | **Accept** — one line in `implement.md`. |
| senior / security | info | AC-34 will be checked against files that must reference existing env-var names, and the module under test carries technology-named symbols that NFR-2 forbids touching. | AC-34 / C-3 | **Accept** — FU-16. `verify.md` states AC-34 covers test-authored names, messages and comments only. |
| senior | info | With the memo stood in, AC-29 largely asserts map semantics; the real value is AC-30 and the key handling. Keep the stand-in in one file. | AC-29 / AC-30 | **Accept** — already the plan. |
| performance | info | AC-17's timing claim is only as real as the after-response stand-in. | AC-17 | **Accept** — folded into FU-4: assert the recorder returned before any callback ran. |
| performance | info | Coverage stays folder-wide, so a coverage run instruments the whole repository for five new files. | C-6 | **Accept** — cost already paid; out of scope. |
| security | info | No observability path is touched, protected globs are respected, and rollback is deleting new files plus one config line. | plan Files to change / Rollback | **Accept** — proceed. |

## Decision

`APPROVED`

- Rationale: The plan is sound and is the smallest change that satisfies
  AC-1..AC-35. The six major panel findings are all cheap corrections at
  implement time, not plan defects — four of them are gaps against a standard
  the spec already sets (NFR-4: a test that cannot fail is not a test), and two
  are suite-reliability guards the existing authed-fetch suite already
  demonstrates. They are recorded below as Required Follow-up Actions binding on
  `/implement`, rather than sent back for a plan revision round.

## Approvals

- Approver (owner): developer (self-review; ADR-009). Comprehension gate passed
  9/9 — see `comprehension.md > Review gate`.

## ADR reference

- ADR: none

## Required Follow-up Actions

These are binding on `/implement`. They change how the plan's steps are carried
out; they do not change its scope, its files, or any acceptance criterion.

- **FU-1** — Stub every backend base URL the refresh tests need to a reserved
  unresolvable host, and assert the recorded call (address and body) in every
  ladder case, not only the returned status. Covers the case where the helper
  returns the right answer for the wrong reason.
- **FU-2** — Write the telemetry recording path before the two silence tests,
  stubbing the environment and analytics key per test and unstubbing after. Add
  the runner's `env` block to the recorded integration surface in
  `implement.md`.
- **FU-3** — Every token, refresh credential, cookie value, analytics key and
  address in the five files is obviously fake and self-describing. Nothing is
  copied from an env file or a live session. Checked by inspection at `/verify`,
  next to AC-34.
- **FU-4** — The after-response stand-in collects callbacks and flushes them
  inside the test body; assert the flush ran and that the recorder returned
  before it. Stub the outbound call at module level rather than relying on the
  fake network as the only backstop.
- **FU-5** — Explicit test and hook timeouts at the top of the refresh and dedup
  files. Every gated promise carries a no-op rejection handler at creation and is
  released in `afterEach`.
- **FU-6** — Fake timers are never left installed across an awaited network
  stub; real timers are restored in `afterEach`.
- **FU-7** — The `server-only` stub lives in `tests/mocks/`, not a new
  `tests/stubs/` folder.
- **FU-8** — Keep the nested mirror shape and note in `implement.md` that the
  existing flattened token-manager test is the odd one out.
- **FU-9** — State in `implement.md` that the alias survives a revert of the test
  files, so the rollback claim stays true once later phases build on it.
- **FU-10** — The stub is conditional rather than empty: it fails when imported
  from a browser-like environment, so the boundary stays loud where it matters.
  The four server test files are pinned to the server-like environment.
- **FU-11** — Pin AC-19 as a characterization test with a recorded finding: an
  upstream rejection not clearing the stored credential is unreviewed, not
  endorsed.
- **FU-12** — Record two findings without fixing either: the limiter identity is
  an unsalted, truncated hash, and the raw client address is exported to a
  third-party analytics processor.
- **FU-13** — The AC-30 finding names both consequences — failure stickiness and
  unbounded key growth — and says whether the key is influenced by untrusted
  input.
- **FU-14** — Reset the module registry only where a flight is left un-settled;
  the outcome-ladder tests share one import.
- **FU-15** — Prove AC-32 with a randomised-order second pass rather than a plain
  repeat.
- **FU-16** — `verify.md` states that AC-34 covers test-authored names, messages
  and comments only; existing env-var and symbol names are not counted against
  it.
