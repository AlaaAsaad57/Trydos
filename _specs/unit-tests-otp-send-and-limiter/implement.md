---
ticket: unit-tests-otp-send-and-limiter
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Implement — unit-tests-otp-send-and-limiter

> Record of what was actually built, following `plan.md`.

Entry path: **initial**, from `state: approved`. Branch
`ticket/unit-tests-otp-send-and-limiter`, created from a clean `develop` (this
repository's base branch overrides the shared rule's `main`; see CLAUDE.md >
Project profile). No commit was created and nothing was pushed (IM-9).

## Changes made

Every file below is listed in the approved `plan.md > Files to change`. Nothing
else was touched (IM-4).

- `tests/mocks/serverRequests.ts` — the limiter stand-in's default reply now has
  the shape the real limiter returns (`{ allowed, reason, lockSeconds }`) instead
  of `{ blocked: false }`, which the real code never returns. The comment records
  why it mattered: the send action reads `allowed`, so against the old reply it
  read `undefined`, treated it as false, and refused every send — any test that
  let the real action run would have proved the opposite of what it looked like.
  **AC-17.**
- `tests/setup.test.tsx` — the guard that pins that reply now asserts the real
  shape, and its name and comment changed with it (it claimed to describe an
  always-empty cache; it describes the limiter). Lockstep with the file above.
- `tests/serverActions/sendOtp.test.ts` — **new**, and it creates the
  `tests/serverActions/` mirror folder. 23 tests. **AC-1 to AC-10, AC-16.**
- `tests/serverRequests/radis/index.test.ts` — **new**, full source path
  mirrored. 17 tests. **AC-11 to AC-16.**
  **Protected-path statement:** the module under test
  (`serverRequests/radis/index.ts`) is under the protected glob
  `serverRequests/**`. **No file inside that glob was edited** — the test lives in
  the `tests/` mirror, which exists precisely so a new test does not trigger the
  protected-path stop (TR-3 carried to verify).
- `docs/testing/UNIT_TEST_ROADMAP.md` — both files recorded in journey 2 as an
  entry **outside** the numbered phases, so no phase number changes and the "29
  phases" count stays true; plus the stale validation-profile line corrected.
  **AC-18.**
- `docs/testing/LIVE_TEST_ROADMAP.md` — phase 6 now records that the wrapper is
  covered by unit tests and that the script itself is still that phase's job, with
  an explicit instruction not to read the unit tests as end-to-end evidence; plus
  the same stale profile line corrected. **AC-19.**
- `_specs/unit-tests-otp-send-and-limiter/spec.md` — the one non-functional line
  now names `logic-change`, so the spec and the plan agree.

### The review's obligations of implementation, and where each one landed

`review.md` recorded these as binding on implementation rather than as blocking
follow-ups. All are applied:

| Obligation | Where |
|---|---|
| Unset the three cache credentials before the module loads; restore after | `radis/index.test.ts` — inside `vi.hoisted` (runs before imports) and `afterAll` |
| Pre-seed the module's global client cache with the fake client | same `vi.hoisted` block — the module reads that cache before constructing, so no client is built at all |
| Order the `AC-11` block: clear → stub marker → re-import → restore → re-seed | the "no counter store" test, in a `try/finally` |
| Clear the global client in the file's own teardown too | `afterAll` |
| Destructive operations throw **and** are asserted never called | the fake client's `del`/`scan`/`keys`, plus the closing "nothing real was touched" block |
| Pass the cooldown explicitly for `AC-14` rather than reading it from the machine | the lock-time fallback test |
| Single-use replies only where the limiter is consulted; restore the default in teardown | `sendOtp.test.ts` — `afterEach` resets the shared spy and re-applies the documented default |
| Stub the cooldown value in the action test | `beforeEach` (`OTP_COOLDOWN_SECONDS`) |
| Reserved, non-routable phone fixtures; documentation-range addresses | `PHONE`/`TYPED_PHONE` (`+999…`) and `IDENTITY.rawIp` (`192.0.2.10`) |
| Keep the exploitable route's path out of a committed comment | the fail-open comment names the behaviour and the ticket slug only |
| Backend address stubbed to the suite's reserved domain | `beforeEach` (`https://example.com`) |
| Coverage read once, from the same coverage-enabled run | see Validation below |

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `tests/mocks/serverRequests.ts` — modified
- `tests/setup.test.tsx` — modified
- `tests/serverActions/sendOtp.test.ts` — new
- `tests/serverRequests/radis/index.test.ts` — new
- `docs/testing/UNIT_TEST_ROADMAP.md` — modified
- `docs/testing/LIVE_TEST_ROADMAP.md` — modified
- `_specs/unit-tests-otp-send-and-limiter/*` — the ticket's own artifacts

## Deviations from plan

1. **The subject of each new test file is imported inside the tests, not at the
   top.** The plan said each file "registers" its stand-ins in order and did not
   say how the subject is loaded. A top-level import of the action failed
   outright: `vi.mock` factories are hoisted, so they ran before the stand-in
   objects they close over existed (`ReferenceError: Cannot access 'headers'
   before initialization`). The action test therefore loads the action through a
   small loader inside the tests, which is the shape
   `tests/serverRequests/HandleAuthedFetch.test.ts:95` already uses for the same
   reason. No acceptance criterion changes.
2. **The lift mechanism was proven first, as planned, and it works.** Each file's
   opening test asserts the real module loaded rather than the stand-in
   (`vi.isMockFunction(...) === false`). Both previously-unproven mechanisms —
   lifting a stand-in registered in the shared setup file, and importing a
   server-action module for real — now have a precedent in this suite.
3. **The two refused findings are not yet written into `verify.md`, and the two
   follow-up tickets do not exist yet.** `/implement` may not create another
   artifact, and `verify.md` belongs to `/wf:verify`. Both are carried forward:
   - `secure-clear-redis-route` — `app/api/clearRedis/route.ts`: unauthenticated
     `GET`, `Access-Control-Allow-Origin: *`, calls the key-clearing maintenance
     function and then deletes the product cache; the `OPTIONS` check inside the
     `GET` handler is dead code. Four defects, one ticket. **A platform firewall
     rule blocking that path is available now at zero code change.**
   - `otp-phone-length-upper-bound` — the send action's guard has a lower bound
     and no upper one. A test in this ticket documents the behaviour; the guard is
     unchanged.
4. **No other deviation.** No production file was touched, no protected runtime
   path, and nothing outside the plan's list.

## Validation run during implementation

Profile `logic-change` — all three checks pass:

- `pnpm lint` (repo-wide) — **exit 0**. 39 warnings, all pre-existing and none in
  the changed files.
- `pnpm exec next typegen` then `pnpm exec tsc --noEmit` — **exit 0**.
- `pnpm test:run` (the whole suite, not only the new files, because the corrected
  stand-in is loaded by every test file) — **30 files, 1051 tests, all passing.**
  40 of those tests are new: 23 in the action's file, 17 in the limiter's.

Coverage, generated **once** from a single coverage-enabled run and read from the
summary file:

- `serverActions/sendOtp.ts` — **94.7% of statements, 82.4% of branches, 100% of
  functions** (was 0%).
- `serverRequests/radis/index.ts` — **20.5% of statements** (was 0%). That number
  is for the whole file, and the whole file was never in scope: it serves three
  unrelated jobs and only the OTP limiter was this ticket's subject. The caching
  helpers, the generic fixed-window limiter and the key-clearing maintenance call
  are explicitly out of scope, and the low figure is the honest reflection of
  that, not a gap in what was agreed.
