---
ticket: unit-tests-otp-send-and-limiter
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Verify — unit-tests-otp-send-and-limiter

> Final validation and impact review before the ticket is closed.

Run on `ticket/unit-tests-otp-send-and-limiter` at depth **all-ac**: every one of
the 19 acceptance criteria is mapped to a result (VF-4). Read-only — no
implementation file was modified and no commit was created (VF-7 / VF-10). The
working tree held the same seven entries before and after the checks (VP-2).

## Checks performed

- Validation profile: `logic-change` — resolved from
  `.claude/project-config.yaml`: `lint`, `typecheck`, `unit-tests`, each at depth
  `all-ac`, each `pass_when: exit-zero`. Commands come only from
  `validation_checks` (VP-4).

**Profile checks, executed locally (VP-3):**

| Check | Command (resolved) | Exit | Output summary | Result |
|-------|--------------------|------|----------------|--------|
| lint | `pnpm lint` | 0 | 39 problems, **0 errors**, 39 warnings — all pre-existing, none in a file this ticket changed | pass |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no output | pass |
| unit-tests | `pnpm test:run` | 0 | 30 files, 1051 tests, all passing (40 of them new) | pass |

**Acceptance criteria.** Each row names the test that proves it. All were run by
the `unit-tests` check above (exit 0); the two documentation criteria are verified
by inspecting the change, with the evidence stated.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | `sendOtp` › "refuses too few digits / nothing at all / only punctuation without consulting the limiter" (3 cases) | `pnpm test:run` | 0 | limiter and backend both never called | pass |
| AC-2 | `sendOtp` › "strips everything that is not a digit and adds a single plus" | `pnpm test:run` | 0 | `+999 (000) 000-001` → `+999000000001` in both the limiter call and the request body | pass |
| AC-3 | `sendOtp` › "reports the refusal and never calls the backend" | `pnpm test:run` | 0 | blocked result carries reason and lock time; backend not called | pass |
| AC-4 | `sendOtp` › "says something different for a cooldown than for a cap"; "still reports a wait when the limiter gives no lock time" | `pnpm test:run` | 0 | two distinct messages, each carrying the reported wait | pass |
| AC-5 | `sendOtp` › "finds the verification id nested under data / at the top level" | `pnpm test:run` | 0 | success with the id and a lock time | pass |
| AC-6 | same two cases as AC-5 | `pnpm test:run` | 0 | both reply shapes resolve to the same success | pass |
| AC-7 | `sendOtp` › "passes the backend's message through…"; "digs the message out of the transport's error text"; "falls back to its own words…" | `pnpm test:run` | 0 | message recovered from a plain body and from `HTTP 429 …: {…}` | pass |
| AC-8 | `sendOtp` › "returns a failed result instead of throwing" | `pnpm test:run` | 0 | resolves to a failed result; no exception | pass |
| AC-9 | `sendOtp` › the four "what is recorded about every attempt" cases | `pnpm test:run` | 0 | `sent` / `blocked` / `failed` recorded **exactly once** each, with the reason; asserted against a spy, so silence cannot pass | pass |
| AC-10 | `sendOtp` › "is the identity the action resolved"; `radis` › "keys the cooldown and the counter on the address, and the set on the session" | `pnpm test:run` | 0 | pass-through of the resolved identity; no hash value written into a test | pass |
| AC-11 | `radis` › "allows the send and says so" | `pnpm test:run` | 0 | `{ allowed: true, reason: "no-redis", lockSeconds: 0 }`; the store was never asked | pass |
| AC-12 | `radis` › "allows the send"; "reports the failure instead of swallowing it" | `pnpm test:run` | 0 | fails **open** with reason `error`, and the reporter was called once | pass |
| AC-13 | `radis` › "turns status 1 into cooldown / 2 into session_cap / 3 into ip_cap" | `pnpm test:run` | 0 | each status maps to its own name, all refusals | pass |
| AC-14 | `radis` › "falls back to the configured cooldown when no lock time comes back" | `pnpm test:run` | 0 | lock time 0 → the configured 90, never zero | pass |
| AC-15 | `radis` › "uses the documented defaults when nothing is configured"; "uses the configured values when they are set"; "lets the caller override them" | `pnpm test:run` | 0 | defaults `2 / 4 / 3600 / 60` proved with the four values **absent** | pass |
| AC-16 | `radis` › the four "nothing real was touched" cases; `sendOtp` › "still has the suite-wide stand-in for the cache layer"; plus the whole suite green | `pnpm test:run` | 0 | no client built, no connection attempted, no destructive operation reached, no cache credentials in the environment; stand-ins still in force for the other 28 files | pass |
| AC-17 | `tests/setup.test.tsx` › "hands back a limiter that allows the send" | `pnpm test:run` | 0 | default reply is `{ allowed: true, reason: "ok", lockSeconds: 60 }` — a reply the real limiter can actually give | pass |
| AC-18 | Inspection of `docs/testing/UNIT_TEST_ROADMAP.md` | `git diff -U0` filtered to numbered table rows | 0 | **no numbered phase row changed**; "29 phases" and "Phases 5–11" both intact; the entry is recorded outside the numbering, as agreed | pass |
| AC-19 | Inspection of `docs/testing/LIVE_TEST_ROADMAP.md` | `git diff --stat` | 0 | phase 6 records that the wrapper is unit-covered, that the script is still that phase's job, and that the unit tests are not end-to-end evidence | pass |

**Outcome: PASSED** — 19 of 19 criteria pass.

Coverage, from the single coverage-enabled run (not a check, and no threshold):
`serverActions/sendOtp.ts` 0% → **94.7%** of statements, 82.4% of branches, 100%
of functions. `serverRequests/radis/index.ts` 0% → **20.5%** of statements; that
figure is for the whole file, which serves three unrelated jobs, and only the OTP
limiter was ever in scope.

## Commands run

- `pnpm lint`
  ```
  ✖ 39 problems (0 errors, 39 warnings)
  exit 0
  ```
- `node_modules/.bin/tsc --noEmit --pretty false`
  ```
  (no output)
  exit 0
  ```
- `pnpm test:run`
  ```
  Test Files  30 passed (30)
       Tests  1051 passed (1051)
  exit 0
  ```
- `git status --porcelain` before and after the checks
  ```
  identical: 4 modified, 3 untracked — the checks changed nothing (VP-2)
  ```

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.** This
  repository owns none (`.claude/project-config.yaml > features.observability:
  false`), and none was created.
- **Protected paths (TR-3).** The module under test,
  `serverRequests/radis/index.ts`, is under the protected glob
  `serverRequests/**`. **No file inside that glob was edited** — its test lives in
  the `tests/serverRequests/radis/` mirror, which exists precisely so adding a test
  does not trigger the protected-path stop. No protected **runtime** path was
  touched either: `proxy.ts`, `next.config.ts`, `instrumentation*.ts`,
  `sentry.*.config.ts` and `.github/workflows/**` are all unchanged.
- **Runtime impact: none.** No production file changed. The OTP send path behaves
  exactly as it did before this ticket; what changed is that its refusal paths are
  now executed by tests. Nothing is deployed by this work.

## Findings

Recorded here because the plan refused to fix them and a finding without a
destination is a comment nobody reads again. **Neither is fixed by this ticket.**

1. **`secure-clear-redis-route` — `app/api/clearRedis/route.ts`.** Found by the
   review panel, confirmed by reading the file. **Four defects in one handler:**
   - no authentication at all on a `GET`;
   - `Access-Control-Allow-Origin: *`, so any origin can call it;
   - it calls `flushOtpLimitsAction()`, which scans for every `otp:*` key and
     deletes them — i.e. **anyone who knows the URL can reset every OTP cooldown
     and cap**, which is the abuse boundary this ticket's tests pin;
   - it then deletes every `product*` key, an unauthenticated cache purge; and the
     `OPTIONS` check inside the `GET` handler is dead code.

   **Immediate containment, available at zero code change:** a Vercel Firewall
   rule blocking `/api/clearRedis`. It is configured at the platform edge, so it
   breaches no rule this ticket operates under. **Do not read the green tests in
   this ticket as evidence that the OTP limiter is safe in production.**

2. **`otp-phone-length-upper-bound` — `serverActions/sendOtp.ts`.** The number
   guard has a lower bound (six digits) and **no upper bound**, so an arbitrarily
   long run of digits passes through to the limiter and into the per-session key
   set. At the time of this gate the guard was unchanged, because this ticket
   changes no production code.

   **Fixed afterwards, on this branch, outside this ticket's scope.** The guard now
   also refuses a number longer than 15 digits (E.164's maximum, and the most the
   phone input can produce), reusing the existing `Invalid Phone Number` refusal so
   no new user-visible string was introduced. The test that recorded the gap was
   replaced by tests that pin the fix: two refusal cases ("one digit too many",
   "an absurdly long run of digits"), both accepted boundaries, and a case proving
   the range counts digits rather than characters. **That change is not covered by
   this ticket's acceptance criteria and was not put through a review gate** — the
   AC table above still describes the state at the gate.

Finding 1 still needs `/wf:start-ticket`; its slug is a reservation, not an
existing ticket, and it is worth opening before anything else in this area.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer — self sign-off (ADR-009). Comprehension gate passed 4/4
  (`comprehension.md > Verify gate`), including the mandatory integration question.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: the work is complete and validated but **not yet delivered** — it sits as
  uncommitted edits on `ticket/unit-tests-otp-send-and-limiter`. Closing the ticket
  does not publish it; `/wf:publish-pr` does, and it is orthogonal to state.
