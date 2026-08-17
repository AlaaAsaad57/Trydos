---
ticket: unit-tests-otp-send-and-limiter
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-17
links:
  clickup:
  github:
---

# Research — unit-tests-otp-send-and-limiter

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Put the two untested files in the OTP send path under unit test —
`serverActions/sendOtp.ts` and the `otpRateLimit` wrapper in
`serverRequests/radis/index.ts` — and record them in the unit roadmap, which
lists neither today.

## Relevant directories

- `serverActions/` — holds the single file `sendOtp.ts` (166 lines). It is the
  only way an OTP send happens, it decides the rate limit before the backend is
  called, and it has no test. There is no `tests/serverActions/` mirror yet, so
  this ticket creates the folder.
- `serverRequests/radis/` — holds `otpRateLimit` (the wrapper around the Lua
  script), `fixedWindowRateLimit`, the cache helpers, and
  `flushOtpLimitsAction`. **This is a protected path** (`serverRequests/**`), so
  the phase is 🔒: the test goes in the `tests/` mirror, and `plan.md` and
  `verify.md` must both carry the protected-path statement (TR-3).
- `tests/mocks/` — the stand-in factories this ticket must reuse rather than
  reinvent (roadmap rule 5): `nextHeaders.ts`, `mockFetch.ts`,
  `serverRequests.ts`, `serverActions.ts`, `authGraph.ts` (which already exports
  `makeSendOtpMock` and `SEND_OTP_NO_REPLY` for the *service* side).
- `tests/serverRequests/` — the existing mirror where the limiter test belongs,
  next to `HandleAuthedFetch.test.ts`, `ServerFetch.test.ts` and
  `requestDedup.test.ts`.
- `utils/server/` — `otpIdentity.ts` and `otpTelemetry.ts`. `sendOtp.ts` calls
  both. Both already have their own tests from phase 8, so this ticket tests how
  the action *uses* them, not what they do.
- `docs/testing/` — `UNIT_TEST_ROADMAP.md` (needs the two files recorded) and
  `LIVE_TEST_ROADMAP.md` (phase 6 already owns proving the limiter for real).

## Relevant config files

- `vitest.config.mts` — two projects. The `unit` project runs in **jsdom**, so a
  server-side test must open with the `// @vitest-environment node` docblock, the
  way `tests/serverRequests/HandleAuthedFetch.test.ts` and
  `tests/utils/server/otpTelemetry.test.ts` already do. `coverage.include`
  already lists `serverActions/**` and `serverRequests/**`, so both files are
  counted today and both report 0%. Nothing in the coverage settings changes.
- `tests/setup.ts` — the decisive file. Lines 41–52 register two run-wide
  stand-ins with `vi.mock`: `serverActions/sendOtp` and `serverRequests/radis`.
  Both files under test are therefore replaced for every test file in the suite,
  which is why neither has ever been executed. A single test file can lift its
  own stand-in; the registration itself stays.
- `tests/setup.test.tsx` — fails if the cache stand-in is removed from
  `tests/setup.ts`. It guards the registration, so lifting a stand-in inside one
  test file does not disturb it.
- `tests/mocks/serverRequests.ts` — the cache stand-in. See risk 1: its
  `otpRateLimit` reply does not have the shape the real one returns.
- `package.json` — the test scripts (below). No script changes are expected.

## Possibly affected services

- **The OTP send flow** (`services/auth.ts` → `sendOtpAction` → `otpRateLimit` →
  the core backend). No production code changes, so no runtime behaviour moves.
  What changes is that the refusal branches finally get executed by something.
- **Every other test file**, but only if the shared cache stand-in is corrected
  (risk 1 / OQ-2). No test consumes `cacheSpies.otpRateLimit` today, so the blast
  radius is currently zero — that is a fact worth re-checking at plan time rather
  than assuming.
- **The CI coverage number.** `pnpm test:ci` writes `coverage-summary.json` and
  the workflow posts the percentages to Telegram. Two files moving off 0% will
  move the headline slightly. No action needed; just do not read the change as a
  regression somewhere else.
- **Nothing in `observability/**` and no protected runtime path** (`proxy.ts`,
  `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
  `.github/workflows/**`) is involved.

## Test / validation commands available

Listed only — none were run.

- `pnpm test:run` — the isolated unit suite (`vitest run --project unit`). The
  gate this ticket's work has to pass.
- `pnpm test` — the same suite in watch mode, for writing the tests.
- `pnpm test:coverage` — adds the coverage report; the way to confirm both files
  moved off 0%.
- `pnpm test:ci` — what CI runs (coverage + the JSON reporter).
- `pnpm lint` — ESLint, including the i18n key rules.
- `pnpm lint:i18n-parity` — translation-file parity. No user-visible strings are
  added by this ticket, so it should be untouched.
- `pnpm exec next typegen` then `pnpm exec tsc --noEmit` — the type check, in
  that order, exactly as `.github/workflows/tests.yml` runs it.
- `pnpm test:live` — out of scope here; named only because the Lua half of the
  limiter is handed to it.

**Validation profile for `plan.md`: `tests-and-types`** (every phase in the unit
roadmap names it).

## Risks and unknowns

- **The shared cache stand-in has the wrong shape, and it silently inverts the
  result.** `tests/mocks/serverRequests.ts:36` replies `{ blocked: false }`, but
  the real `otpRateLimit` returns `{ allowed, reason, lockSeconds }`.
  `serverActions/sendOtp.ts:86` reads `limit.allowed`, which is `undefined`
  against that stand-in — falsy — so the real action would take the **blocked**
  branch on every call. Any test of the action must set its own reply, and the
  stand-in itself is drifted. Impact: high for this ticket, because it is the
  first thing that will make a test lie. Likelihood: certain — it is in the file
  today.
- **Lifting a run-wide stand-in inside one file is a new pattern in this suite.**
  No existing test file does it. `vi.unmock` is the documented way; if it fights
  the hoisting order, the fallback is re-registering the module with
  `vi.mock(id, async (importOriginal) => await importOriginal())` in the test
  file. Impact: medium — it changes how the test file opens, not what it proves.
- **`ioredis` opens a real socket the moment `serverRequests/radis` loads**, and
  the client is built at module load, not on first use. The limiter test must
  stand in `ioredis` before the module is imported. If it does not, the test does
  real I/O and breaks roadmap rule 5 without failing loudly.
- **The telemetry call is fire-and-forget.** `captureOtpAttempt` is called
  without `await` and defers through `next/server`'s `after`. The existing
  telemetry test had to flush that queue by hand and fail the test if anything
  was still pending, or a swallowed error becomes a passing test that quietly
  reached the network. The action's test has to either stand in
  `utils/server/otpTelemetry` or repeat that discipline.
- **`resolveOtpIdentity({ ensureUserId: true })` can call the network.** It
  registers a guest when no user id exists, and the fake network is set to fail a
  test on any unhandled request. Standing in `utils/server/otpIdentity` avoids
  it; running it for real means handling that call.
- **The action offers no injection point.** Every dependency is a module-level
  import, so it can only be tested through module stand-ins. Roadmap rule 4 says
  that is a finding to record, not a licence to refactor — recorded here.
- **The limiter's real decision lives in Lua, not in TypeScript.** A unit test
  can only prove the wrapper around it (fail-open, defaults, status→reason
  mapping, `lockSeconds` fallback). Believing the unit test proves the limiter
  works is the risk; the spec has to say plainly that it does not.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Where do these two files get recorded in `docs/testing/UNIT_TEST_ROADMAP.md` — extend phase 8 (`unit-tests-otp-locks-refresh-and-dedup`, already the OTP-adjacent phase), extend phase 10, or add a new phase after 9? | The roadmap is the ordering record for journey 2. Rule 1 says a phase covers a journey slice, so putting these under a phase that does not describe them would make the roadmap wrong in a new way instead of fixing it. |
| OQ-2 | Is correcting `cacheSpies.otpRateLimit` in `tests/mocks/serverRequests.ts` to the real `{ allowed, reason, lockSeconds }` shape inside this ticket, or is it a separate one? | It is a shared test file every other file loads. Rule 4 does not forbid it (it is not code under test), but it widens the blast radius from two new test files to the whole suite. |
| OQ-3 | For the action's test, is standing in `utils/server/otpIdentity` acceptable, or must the real identity resolution run? | It decides whether the test proves that the `sid` and `ip` keys actually reach the limiter, or only that *something* was passed. Running it for real drags in `next/headers` and a guest-registration request. |
| OQ-4 | How far does the limiter test go — the wrapper only (fail-open, the four env defaults, the status→reason mapping, the `lockSeconds` fallback) with a stood-in `ioredis`, or does it also simulate `redis.eval` return values to walk each status? | Both are reasonable; the second proves more of the mapping but pins the test to the Lua contract, which the live suite is meant to own. The boundary has to be written down once so it is not re-argued at review. |
| OQ-5 | Is the hand-off of the Lua half to live phase 6 recorded in `docs/testing/LIVE_TEST_ROADMAP.md` as well, or stated only in this ticket's `spec.md`? | If it lives only in the ticket, whoever picks up live phase 6 will not know a unit test already covers the wrapper, and will either duplicate it or assume it is covered. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
