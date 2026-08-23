---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Plan — unit-tests-otp-locks-refresh-and-dedup

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Five new test files in the `tests/` mirror, one per module, plus the two small
pieces of harness the research proved are missing: a stub that makes the
`server-only` marker resolvable in the runner, and — inside the dedup test file
only — a stand-in for the framework's per-request memo, which does nothing
outside a real render. No module under test is touched (NFR-2).

Three decisions carry the ticket, and each rules out the obvious alternative:

- **All five test files go in the `tests/` mirror**, not colocated. The
  convention document says "colocate unless the source is under a protected
  glob", but the repository's actual practice has moved: `utils/fetchData.ts`
  and `utils/server/tokenManager.ts` are both unprotected and both have their
  tests in the mirror. Only the Phase-1 example is colocated. Splitting this
  ticket's five files across two locations to satisfy a rule the repository no
  longer follows would make the suite harder to find, not easier. The divergence
  between the document and the practice is recorded as a finding; correcting the
  document is a separate ticket (answers **OQ-1**).
- **`server-only` becomes resolvable through one alias in the shared runner
  config**, pointing at an empty stub, rather than a per-file stand-in in each
  of the two files that need it. A per-file stand-in of a module id that cannot
  be resolved at all is the fragile option, and it would have to be repeated by
  every future phase that touches a server-only module. One alias is smaller in
  total and honest about what it does: it reproduces what the framework's build
  already does (answers **OQ-3**).
- **The dedup helper is tested against a stand-in memo, and the test says so.**
  The framework's memo helper is a pass-through when there is no render in
  progress, in both builds — verified by reading them, not assumed. So the test
  supplies the stable per-request store the helper is designed to sit on, and
  then proves *our* key handling and promise sharing on top of it. A fresh
  request is simulated by resetting the module registry. What this deliberately
  does not prove is the framework's own per-request scoping — that is the
  framework, and the conventions say to assume it works (answers **OQ-2**).

## Steps

1. Add the `server-only` stub and wire the alias in the runner config. Prove it
   by loading one of the two server-only modules in a scratch run before writing
   any assertion — if this step is wrong, three of the five files cannot start.
2. Write the client lock-store tests (AC-1..AC-7). Browser-like environment,
   fake timers for every time-dependent assertion, storage cleared between
   tests. Cover the two "storage misbehaves" cases by making the storage throw.
3. Write the identity-resolver tests (AC-8..AC-14). Server-like environment, the
   existing request-reader stand-in for cookies and headers, its refuse-writes
   mode for the pure-render case, and a stubbed network for the guest
   registration. Backend addresses come from reserved unresolvable hosts, so an
   escaped call dies locally instead of leaving the machine.
4. Write the telemetry tests (AC-15..AC-17). Stand in the framework's
   after-response hook so the deferred callback actually runs and can be
   asserted; stub the outbound call so the recorded body is readable. Assert the
   two silent-by-design gates by proving no call was made, and assert the
   swallow path by proving the recorder still returns normally when the call
   rejects.
5. Write the refresh-helper tests (AC-18..AC-28). One file, three describe
   blocks. Every test re-imports the module through a reset registry, because
   the single-flight state lives at module scope and would otherwise leak
   between tests. The single-flight cases use a gated network that does not
   settle until the test releases it — the same shape the existing services
   suite uses.
6. Write the dedup tests in the protected-path mirror (AC-29, AC-30), including
   the pinned no-eviction behaviour written up as a finding, not a fix.
7. Cross-check the outcome vocabulary against the stand-in used by the existing
   authed-fetch suite (AC-35). Record any disagreement as a finding rather than
   editing either suite's subject.
8. Run the validation profile's checks and write `implement.md`, carrying every
   finding: the placement divergence, the framework-memo limitation, the
   no-eviction behaviour, and anything else the writing turns up.

## Files to change

All new files unless marked. No module under test is modified.

- `tests/stubs/server-only.ts` — **new.** Empty module standing in for the
  server-only marker, which is not an installed package and cannot resolve in
  the runner (research R-2).
- `vitest.config.mts` — **modified, one entry.** Resolve `server-only` to the
  stub above. No other setting changes; the coverage block is left alone (C-6).
- `tests/utils/otpLocks.test.ts` — **new.** AC-1..AC-7. Browser-like
  environment.
- `tests/utils/server/otpIdentity.test.ts` — **new.** AC-8..AC-14. Server-like
  environment.
- `tests/utils/server/otpTelemetry.test.ts` — **new.** AC-15..AC-17.
  Server-like environment.
- `tests/utils/server/authRefresh.test.ts` — **new.** AC-18..AC-28.
  Server-like environment.
- `tests/serverRequests/requestDedup.test.ts` — **new.** AC-29, AC-30. **This is
  the protected-path file.** `serverRequests/**` is a protected glob, so the test
  goes in the mirror and no file is added inside the glob (C-1, TR-3). The
  framework-memo stand-in lives in this file only, so it cannot affect the other
  four.
- `_specs/unit-tests-otp-locks-refresh-and-dedup/implement.md` — **new,** written
  by `/implement`; carries the findings.

Not changed, on purpose: `tests/setup.ts` (its global stand-ins already cover
what this ticket needs), `tests/msw/handlers.ts` (outbound calls are stubbed per
file instead — see the integration surface), `docs/testing/UNIT_TESTING.md`, and
every module under test.

## Integration surface

- **Components / shared config touched:** `vitest.config.mts` — the single
  configuration every test file in the repository loads. The change is one
  resolution alias for `server-only`. Also touched indirectly: the global
  stand-ins in `tests/setup.ts` (the cache layer, the router, the send-OTP
  action) and the fake network, which apply to these five files whether they ask
  for them or not.
- **Who else depends on them:** every existing test file (13 today) resolves
  through the same config. Three other things depend on what this ticket pins:
  the existing authed-fetch suite, which stands in the refresh helper with a
  hand-written shape and asserts against the same outcome vocabulary; the auth
  route handlers (refresh and expire), which branch on that same vocabulary and
  are a later phase's subject; and the listing filters page, the only caller of
  the dedup helper, which a later component phase will exercise.
- **Overlapping flows:** two places where this ticket's code is shared with
  another use case. First, the refresh helpers are reached from three directions
  — the authed server fetch, the refresh route, and the expire route's
  last-chance attempt — so the outcomes pinned here are a contract for all
  three, not just for the fetch path. Second, the client lock store is used by
  five sign-in components *and* by the auth service, and the existing auth
  service suite mocks it; this ticket owns the real one, so the two must not
  contradict each other about what a lock or a cap means.
- **Ordering / lockstep dependencies:** none inside this ticket — the five files
  are independent and can be written in any order. Across the roadmap there is
  one: the later auth-service, auth-routes and component phases assert against
  the vocabulary and the lock semantics pinned here, so a change to either after
  this ticket has to move those phases with it.
- **What breaks if this is wrong:** the alias is the one change with reach
  beyond this ticket. Today, any test that transitively imports a server-only
  module fails loudly at import; after the alias it will load instead. The only
  other server-only module in the repository is the push-notification admin
  helper, reached solely by four API routes that no test loads, and its
  initialisation is lazy — so nothing connects to anything at import time. The
  concrete failure mode to watch is therefore not a hang or a live connection
  but a silent one: a future test that should have failed loudly for importing
  server code into a browser-like environment will now load it quietly instead.
  A wrong stand-in for the after-response hook fails the same way — the
  telemetry assertions would pass while recording nothing, which is exactly what
  AC-17 and AC-31 exist to catch.

## Validation strategy

- Validation profile: `logic-change`
- Every acceptance criterion is proved by a test in the file named for it above;
  `/verify` maps AC-1..AC-35 to the assertions that cover them.
- Two criteria are proved by inspection rather than by an assertion, and
  `verify.md` must say so plainly: AC-33 (nothing outside the test surface was
  modified) is proved by the diff, and AC-34 (no test text names the technology
  behind a backend) by reading the five files.
- AC-32 (repeatable, order-independent) is proved by running the suite twice.
- The protected-path statement required by TR-3 goes in `verify.md`: no file was
  added or changed inside `serverRequests/**`; the dedup test sits in the mirror.

## Rollback

Every file except one is new, so reverting is deleting them. The single modified
file, `vitest.config.mts`, gains one resolution entry; removing that entry
returns the runner to its current behaviour, at the cost of the two server-only
modules becoming unloadable again. The whole ticket is one branch and one PR
against `develop`, so `git revert` of the merge is the single-step undo. Nothing
ships to a user and no runtime behaviour changes, so a rollback has no effect on
production.

## Out of scope

- Changing any module under test, including a refactor that would make one
  easier to test. Findings are recorded, not fixed (NFR-2).
- Fixing the no-eviction behaviour of the dedup helper that AC-30 pins.
- Updating `docs/testing/UNIT_TESTING.md` to match where tests actually live —
  recorded as a finding, corrected in its own ticket (see **OQ-1**).
- Touching the shared network handlers or the shared setup file.
- The send-OTP action, the auth route handlers, the server-side rate limiter,
  the sign-in components, and the client-side refresh dedup already covered.
- Any coverage-configuration change (C-6), any pipeline, and any browser-level
  test suite.
