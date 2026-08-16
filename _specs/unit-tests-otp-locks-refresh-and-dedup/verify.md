---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Verify — unit-tests-otp-locks-refresh-and-dedup

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `logic-change` — resolved from
  `.claude/project-config.yaml`: `lint`, `typecheck`, `unit-tests`, each at depth
  `all-ac`.

Three checks were executed and their commands came only from
`validation_checks`. Every one of the 35 acceptance criteria is mapped below.
Where an AC is proved by inspection rather than by an assertion, the row says so
plainly — the plan required that and it is not hidden here.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Lock counts down in whole seconds, reports 0 when spent | `pnpm test:run` | 0 | *reading a number back (AC-1)* — 3 tests | pass |
| AC-2 | No store for a digitless value or a zero-second lock | `pnpm test:run` | 0 | *locking a number (AC-2)* — 2 tests | pass |
| AC-3 | A counted number takes no second slot; first-seen does not move | `pnpm test:run` | 0 | byte-for-byte store comparison after a 30-minute gap | pass |
| AC-4 | Cap blocks a new number at the limit, never a counted one | `pnpm test:run` | 0 | *counting distinct numbers* — 4 tests | pass |
| AC-5 | A number past its hour stops counting | `pnpm test:run` | 0 | *the window moving on (AC-5)* — 3 tests, incl. the exact boundary | pass |
| AC-6 | Unreadable state, wrong-shape state, refused write all survive | `pnpm test:run` | 0 | *when storage misbehaves (AC-6)* — 3 tests | pass |
| AC-7 | Inert with no browser present | `pnpm test:run` | 0 | *with no browser present (AC-7)* — 3 tests | pass |
| AC-8 | Same visitor → same keys; different visitor → different | `pnpm test:run` | 0 | 4 tests, incl. keys surviving a credential and account-id rotation | pass |
| AC-9 | Address reduced to a stable identity in every form | `pnpm test:run` | 0 | 9 table cases + the two-sessions-one-connection case + header order | pass |
| AC-10 | Visit id minted once, lifetime far longer than the session token | `pnpm test:run` | 0 | asserts 1 year, and greater than the token's own lifetime | pass |
| AC-11 | Usable keys when cookies cannot be written | `pnpm test:run` | 0 | writes refused, keys still resolve, mint reported | pass |
| AC-12 | Guest registration stores what came back and reports the id | `pnpm test:run` | 0 | one call, to the gateway, with the visitor's locale | pass |
| AC-13 | Failed or dropped registration → no id, reported, no throw | `pnpm test:run` | 0 | 2 tests, both assert the failure was reported once | pass |
| AC-14 | No registration when an id exists or none was asked for | `pnpm test:run` | 0 | 2 tests, both assert zero calls | pass |
| AC-15 | Silent outside production and without an analytics key | `pnpm test:run` | 0 | *staying silent where it should* — written after the recording path, so it cannot pass by default | pass |
| AC-16 | Recorded attempt carries outcome, reason, both addresses, identity, flags | `pnpm test:run` | 0 | 6 tests incl. profile-suppression and location-lookup flags | pass |
| AC-17 | Returns before sending; an analytics failure is swallowed | `pnpm test:run` | 0 | asserts zero calls at return, then a flushed call | pass |
| AC-18 | Ineligible while signing out, no-token when none stored, no exchange | `pnpm test:run` | 0 | market + chat + stories | pass |
| AC-19 | Rejection → invalid, stored credential untouched | `pnpm test:run` | 0 | asserts the call happened, and the jar is unchanged | pass |
| AC-20 | Dropped connection, server error, unreadable reply, half a pair → unavailable + reported | `pnpm test:run` | 0 | 6 tests; each asserts the address that was called | pass |
| AC-21 | Both halves stored together, each with its own lifetime | `pnpm test:run` | 0 | asserts both are hidden from the browser and the refresh lifetime is the longer | pass |
| AC-22 | Profile written only when the reply carries one | `pnpm test:run` | 0 | 2 tests — the downgrade guard | pass |
| AC-23 | A context refusing writes is reported | `pnpm test:run` | 0 | outcome still refreshed, failure reported once | pass |
| AC-24 | Verified shopper → core backend; guest → gateway | `pnpm test:run` | 0 | 3 cases, incl. no stored profile at all | pass |
| AC-25 | Visitor's locale sent, documented fallback when absent | `pnpm test:run` | 0 | 2 tests | pass |
| AC-26 | Concurrent callers share one exchange; a later call exchanges again | `pnpm test:run` | 0 | 2 tests, gated replies | pass |
| AC-27 | The three helpers never share an exchange | `pnpm test:run` | 0 | 3 concurrent calls → 3 distinct addresses | pass |
| AC-28 | Stories pair read from both the flat and the wrapped shape | `pnpm test:run` | 0 | 3 tests, incl. which wins when both are present | pass |
| AC-29 | Same key → one execution, shared result; different keys → separate | `pnpm test:run` | 0 | 6 tests, incl. same-promise identity and near-identical keys | pass |
| AC-30 | Failure behaviour pinned as a finding, helper unchanged | `pnpm test:run` | 0 | 3 tests; finding F-3 records both consequences | pass |
| AC-31 | No real I/O; an escaped call fails the test | `pnpm test:run` + inspection | 0 | queue-exhausted network throws by name; unhandled requests error; deferred work must be flushed or `afterEach` fails; every host is a reserved unresolvable name | pass |
| AC-32 | Repeatable and order-independent | `pnpm test:run`, then the same with `--sequence.shuffle` | 0 | 536/536 both times; shuffled seed 1786791141063 | pass |
| AC-33 | Nothing outside the test surface modified | inspection (`git status`) | — | Only the planned files, plus the carried roadmap edit named in `implement.md`. No module under test appears. | pass |
| AC-34 | No test text names the technology behind a backend | inspection | — | Backends are called "core" and "gateway" throughout. One hit: the analytics capture address — a third-party processor, asserted not authored (F-11). Existing env-var names quoted as-is (FU-16). | pass |
| AC-35 | Outcome vocabulary matches the existing authed-fetch stand-in | inspection | — | `refreshed / no-token / invalid / ineligible / unavailable` — identical. No disagreement to record (F-10). | pass |

**35 of 35 pass.**

## Commands run

- `pnpm test:run` (check `unit-tests`, `pass_when: exit-zero`)
  ```
  Test Files  18 passed (18)
       Tests  536 passed (536)
    Duration  47.11s
  UNIT-TESTS EXIT: 0
  ```

- `node_modules/.bin/tsc --noEmit --pretty false` (check `typecheck`, `pass_when: exit-zero`)
  ```
  (no output)
  TYPECHECK EXIT: 0
  ```

- `pnpm lint` (check `lint`, `pass_when: exit-zero`)
  ```
  ✖ 37 problems (0 errors, 37 warnings)
  LINT EXIT: 0
  ```
  Every warning is pre-existing, in `services/**` and `utils/**`. None is in a
  file this ticket touched.

- `pnpm test:run -- --sequence.shuffle` (extra pass for AC-32, FU-15)
  ```
  Running tests with seed "1786791141063"
  Test Files  18 passed (18)
       Tests  536 passed (536)
  ```

- `git status --porcelain` before and after the checks — identical. The
  validation commands changed no file (VP-2), and no commit was created (VF-10).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.** This
  repository owns none (`features.observability: false`).
- Were any **protected runtime paths** changed? **No.** `proxy.ts`,
  `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts` and
  `.github/workflows/**` are untouched.
- **Protected-path statement (TR-3).** `serverRequests/**` is a protected glob.
  `git status --porcelain -- serverRequests/` returns **empty**: no file inside
  the glob was added, changed or deleted. The dedup test lives in the
  `tests/serverRequests/` mirror, exactly as `plan.md` declared, and no guardrail
  was weakened to allow it.
- **Runtime impact: none.** No application code was modified. Nothing in this
  ticket ships to a user, changes a response, or runs in production. The one
  non-test file changed, `vitest.config.mts`, is read only by the test runner.
- **Harness impact: yes, and deliberate.** The `server-only` alias changes module
  resolution for every test file in the repository. It is not silent: the stub
  throws when a browser-like test reaches server code, so the boundary the marker
  defends is kept rather than dropped (FU-10). This was the mandatory integration
  question at the gate.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer (self sign-off; ADR-009). Verify comprehension gate passed
  **4/4** — see `comprehension.md > Verify gate`. The review gate passed 9/9.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`).
- Notes:
  - **93 new tests**, suite 443 → 536, across five files and two environments.
  - **All 16 review follow-ups (FU-1..FU-16) were applied**; `implement.md` maps
    each to where it landed.
  - **Twelve findings recorded, none fixed** (NFR-2). Three were found by tests
    failing honestly while being written — most usefully F-1, where an assertion
    that expected pruning to persist turned out to be wrong about the code.
  - Four of the panel's six major findings were about tests that would have
    passed without exercising anything. Each now has a positive assertion behind
    it: an asserted call address, a recording path written before its silences, a
    flush that must happen, and an explicit timeout.
  - Two things are left deliberately for other tickets: correcting the two stale
    lines in `docs/testing/UNIT_TESTING.md` (F-6), and whatever the team decides
    about F-2, F-3, F-8 and F-9 — all pinned as current behaviour, none endorsed.
