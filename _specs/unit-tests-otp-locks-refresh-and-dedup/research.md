---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-15
links:
  clickup:
  github:
---

# Research — unit-tests-otp-locks-refresh-and-dedup

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Cover five sign-in-path modules with unit tests — the client OTP lock store, the
server OTP identity resolver, the server OTP telemetry helper, the three
refresh-token exchange helpers, and the per-request dedup helper — without
changing any of the code under test and without any real I/O.

## Modules under test — what each one actually does

Read in full during this stage. Line counts match the intake.

### 1. `utils/otpLocks.ts` (108) — client, `sessionStorage`

Pure functions over one `sessionStorage` key (`otp_guard_v1`) holding
`{ locks, numbers }`. Behaviour worth pinning:

- `normalizePhone` strips every non-digit; a null/undefined input becomes `""`.
- `read()` prunes on every read: a cooldown whose expiry has passed is dropped,
  and a number first seen `>= WINDOW_MS` (1 hour) ago is dropped.
- `read()` swallows malformed JSON and returns an empty state.
- `write()` swallows a `sessionStorage` failure (quota / disabled).
- Every function is a no-op when `window` is undefined (`isBrowser()`).
- `getNumberLockRemaining` returns **whole seconds, rounded up**, floored at 0.
- `lockNumber` ignores an empty key **and `seconds === 0`** (`!seconds`).
- `recordSessionNumber` records the first timestamp only — a second call for the
  same number does not move the window start, and does not write.
- `isSessionCapReached` is true only when `SESSION_MAX` (2) distinct numbers are
  already stored **and** the asked-for number is not one of them.

Constants (`SESSION_MAX = 2`, `WINDOW_MS = 1h`) are module-private, so the tests
have to assert the behaviour, not read the numbers.

### 2. `utils/server/otpIdentity.ts` (258) — server

- `hashKey` — SHA-256, first 32 hex chars; empty input hashes the literal
  `"anon"`. Deterministic, easy to pin.
- `normalizeIp` — the interesting one. Strips `[ ]`, strips a `%zone`, returns
  `0.0.0.0` for empty, returns the embedded IPv4 for an IPv4-mapped IPv6
  (`::ffff:203.0.113.7` → `203.0.113.7`), and collapses a real IPv6 to
  `h1:h2:h3:h4::/64` with leading zeros stripped and lower-cased. `expandIpv6`
  handles `::` compression on either side.
- `resolveOtpIdentity` — reads `cookies()` + `headers()`, resolves/mints the
  durable `VISIT-ID` cookie (1 year, never 48h), reads the user id from
  `User-Data`, optionally registers a guest (`ensureUserId`), and picks the raw
  IP from `x-forwarded-for` (first entry) → `x-real-ip` → `cf-connecting-ip` →
  `0.0.0.0`.
- `registerGuestForOtp` — POSTs to `GO_BACKEND_URL + /auth/register-guest`
  bodyless, writes `MARKET-TOKEN` / `MARKET-REFRESH-TOKEN` / `User-Data` when
  present, returns the new id or null, and logs through `LogServerError` on a
  non-2xx or a throw.
- Both cookie writes are wrapped in `try/catch` so a pure render (writes
  refused) still returns a usable identity — `tests/mocks/nextHeaders.ts`
  already models exactly that with `__setFailWrites`.

### 3. `utils/server/otpTelemetry.ts` (95) — server

`captureOtpAttempt` returns nothing and never throws. Three gates, then the
work: not production → return; no `NEXT_PUBLIC_POSTHOG_KEY` → return; otherwise
`after(async () => fetch(POSTHOG_CAPTURE_URL, …))`. The body is the assertion
target: `distinct_id = sid`, `properties.ip = rawIp`, `normalized_ip`,
`is_whatsapp` coerced to a boolean via `Number(x) === 1`, `source`,
`$process_person_profile: false`, `$geoip_disable: true`. Both the inner and
outer `catch` are silent by design (analytics must not break the OTP flow).

### 4. `utils/server/authRefresh.ts` (415) — server

Three near-identical exchanges — `refreshMarketSession`, `refreshChatSession`,
`refreshStoriesSession` — each with its own module-scope single-flight variable
(`inflight`, `chatInflight`, `storiesInflight`) cleared in `.finally()`. Each
`doRefresh*` walks the same ladder:

1. `LOGOUT-GUARD` cookie present → `ineligible` (no fetch).
2. no refresh cookie → `no-token` (no fetch).
3. network throw → `unavailable` + `LogServerError`.
4. HTTP 401 → `invalid`, and **the refresh cookie is never deleted**.
5. non-ok or unparseable JSON → `unavailable` + `LogServerError`.
6. token pair incomplete → `unavailable` + `LogServerError`.
7. success → write both cookies (`SECURE_COOKIE_OPTIONS` /
   `REFRESH_COOKIE_OPTIONS`), write `User-Data` **only when the response carries
   a user**, and return `{ status: "refreshed", token }`.

Market-only extras: backend selection through `isVerifiedMarketUser()`
(verified → `BACKEND_URL`, guest → `GO_BACKEND_URL`) and `Lang` / `Country`
headers taken from the `local` cookie with `gb-en` as the fallback. The stories
adapter reads the token pair **flat first**, wrapped second — the parser fixed
in commit `090a7a13`, and the one place a shape regression is silent.

Note the market path is the one Phase 5 stood in
(`tests/serverRequests/HandleAuthedFetch.test.ts` mocks
`utils/server/authRefresh`), so this ticket is what closes that gap (research
`OQ-3` of `unit-tests-authed-fetch-and-tokens`).

### 5. `serverRequests/requestDedup.ts` (32) — server, 🔒 protected glob

`dedupeRequest(key, run)` stores the in-flight promise in a
`cache(() => new Map())` store, so the second caller with the same key gets the
first promise back. Two behaviours to pin: same key → `run` executes once and
both callers get the same promise; different keys → two executions. **The entry
is never removed**, so a rejected promise stays cached for the rest of the
request — worth an explicit test that records the current behaviour rather than
calling it a bug (rule 4).

## Relevant directories

- `utils/` — `otpLocks.ts`; the test goes next to it (`utils/otpLocks.test.ts`).
- `utils/server/` — `otpIdentity.ts`, `otpTelemetry.ts`, `authRefresh.ts`. Not a
  protected glob, so colocated tests are allowed here; the existing
  `tokenManager` test nevertheless sits in `tests/utils/` because
  `utils/cookies/**` is protected. Placement for this ticket is `OQ-1`.
- `serverRequests/` — `requestDedup.ts`. **Protected glob**: the test must go in
  the `tests/serverRequests/` mirror.
- `tests/` — the harness. `tests/mocks/nextHeaders.ts` (cookies + headers +
  recorded writes + refuse-writes), `tests/mocks/mockFetch.ts` (queued replies,
  recorded calls), `tests/mocks/cookieManager.ts`, `tests/msw/` (network-level
  answers), `tests/setup.ts` (global stand-ins).
- `tests/serverRequests/`, `tests/utils/` — the existing mirrors and the closest
  worked examples (`HandleAuthedFetch.test.ts`, `tokenManager.test.ts`).
- `serverActions/`, `app/api/auth/` — consumers, read to understand the
  contract; **not** in scope (Phase 10 owns the routes).
- `components/Login/Enhanced/` — consumers of `otpLocks`; Phase 11, not here.

## Relevant config files

- `vitest.config.mts` — jsdom by default, `globals: true`, `setupFiles:
  ./tests/setup.ts`, a fake `test.env`, and the `v8` coverage block. **Its
  `coverage.include` is already folder-wide** (`utils/**`, `serverRequests/**`,
  …), not the explicit file list the roadmap describes, so "append your targets"
  is now a no-op — see R-6.
- `tests/setup.ts` — registers `next/navigation`, `serverActions/sendOtp` and
  `serverRequests/radis` stand-ins for every file, and starts msw with
  `onUnhandledRequest: "error"`. The Redis stand-in is already global, which is
  how roadmap rule 5 ("Phase 8 mocks Redis") is satisfied without this ticket
  doing anything: none of the five modules imports `serverRequests/radis`
  itself — `serverActions/sendOtp.ts` does, and that is Phase 10/9 territory.
- `.claude/project-config.yaml` — the validation checks and profiles.
- `package.json` — `test`, `test:run`, `test:coverage`; `react` / `react-dom`
  are `19.2.0`, which matters for R-1.
- `docs/testing/UNIT_TESTING.md` — the conventions (mirror rule, `vi.mock` +
  `vi.resetModules()` loader, no real I/O, pin anything ambient).
- `docs/testing/UNIT_TEST_ROADMAP.md` — the phase list; already updated for this
  phase's widened scope.

## Possibly affected services

Nothing ships to a user: this ticket adds test files only. The modules the tests
*load* are what could be disturbed, and only inside the test process:

- **Send OTP** (`serverActions/sendOtp.ts` → `resolveOtpIdentity`,
  `captureOtpAttempt`, `otpRateLimit`) — a test that resolves an identity must
  not reach the gateway's `/auth/register-guest`, and a telemetry test must not
  reach `eu.i.posthog.com`. Both are outbound calls in the code under test.
- **Authed server fetch** (`serverRequests/HandleAuthedFetch.ts` →
  `refreshMarketSession`) — Phase 5 stands this helper in; this ticket tests the
  real one. The two must agree on the outcome vocabulary
  (`refreshed | no-token | invalid | ineligible | unavailable`), or Phase 5's
  suite passes against a contract that no longer exists.
- **Refresh route** (`app/api/auth/refresh/route.ts`) and **expire route**
  (`app/api/auth/expire/route.ts`) — the other two callers of the same helpers.
  Phase 10 tests the routes; this ticket must not pre-empt them.
- **Listing filters** (`components/Listing/FiltersPageContent.tsx`) — the only
  caller of `dedupeRequest`. A component test in Phase 25 will exercise it
  indirectly; this ticket tests the helper directly.
- **Sign-in UI** (`components/Login/Enhanced/*`, `services/auth.ts`) — the
  callers of `otpLocks`. `services/auth.ts` is Phase 9 and already has a partial
  suite (`tests/services/authRefreshSession.test.ts`), which mocks
  `utils/otpLocks` — so this ticket owns the real one and there is no overlap.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — the whole vitest suite once, exits. The `unit-tests` check.
- `pnpm test` — watch mode. Never in a gate; it does not exit.
- `pnpm test:coverage` — one run with coverage; writes `coverage/index.html`.
- `node_modules/.bin/tsc --noEmit --pretty false` — the `typecheck` check.
- `pnpm lint` — ESLint, i18n rules included. The i18n rules are off for
  `*.test.*`, so a test file needs no `eslint-disable`.
- `pnpm lint:i18n-parity` — translation-key parity. Not relevant: this ticket
  adds no user-visible string.
- `pnpm build` — production build. Only needed if the ticket touches a
  server/client boundary, which it should not.

The matching profile is `logic-change` (lint + typecheck + unit-tests). The
roadmap says every phase names `tests-and-types`; no profile with that id exists
in `.claude/project-config.yaml` — see `OQ-5`.

## Risks and unknowns

| ID | Risk | Impact / likelihood |
|---|---|---|
| R-1 | **`cache()` does not memoize outside a React render.** Both `react.development.js` and the `react-server` build fall back to `fn.apply(null, arguments)` when there is no dispatcher, and vitest has none. So `requestMemo()` hands back a **brand-new Map on every call**, and `dedupeRequest` would run `run` twice — a naive test fails against correct code. Verified by reading `node_modules/react/cjs/*.js`, not assumed. | High / certain. The dedup test cannot be written without deciding this (OQ-2). |
| R-2 | **`server-only` is unresolvable in this repo.** `otpIdentity.ts` and `otpTelemetry.ts` both start with `import "server-only"`, and the package is not installed — `require.resolve("server-only")` fails. Next aliases it at build time; vitest does not. Importing either module in a test throws before a single assertion runs. | High / certain. Two of the five modules are unreachable until this is decided (OQ-3). |
| R-3 | **`after()` from `next/server` needs a stand-in that actually runs the callback.** The real `after()` outside a request scope throws, and `captureOtpAttempt` swallows that — so an un-mocked test would pass while asserting nothing. The outbound `fetch` also has to be stubbed, or msw's `onUnhandledRequest: "error"` rejects it and the code's own `catch` hides the failure. | High / certain. A telemetry test written without both is a test that cannot fail. |
| R-4 | **Module-scope single-flight state leaks between tests.** `inflight` / `chatInflight` / `storiesInflight` live at module scope, so a test that leaves one set poisons the next. Every test needs `vi.resetModules()` before importing (the convention doc already prescribes the loader pattern). | Medium / likely. Symptom is an order-dependent failure, the hardest kind to read. |
| R-5 | **Time and storage are ambient in `otpLocks`.** Cooldown maths uses `Date.now()` and the 1-hour window; without fake timers the tests are flaky at the boundary. `sessionStorage` also survives between tests in the same jsdom environment unless cleared. | Medium / likely. Cheap to prevent, expensive to debug. |
| R-6 | **The roadmap's coverage rule is stale.** Rule 3 says `coverage.include` is an explicit file list each phase appends to; `vitest.config.mts` now lists whole folders (`utils/**`, `serverRequests/**`, `app/**`, …). Following the roadmap literally would mean editing the config for no effect. | Low / certain. Wastes a plan step and adds a pointless diff. |
| R-7 | **Phase-5 contract coupling.** `tests/serverRequests/HandleAuthedFetch.test.ts` mocks `utils/server/authRefresh` with a hand-written shape. If this ticket's tests pin a different vocabulary, the two suites disagree and one of them is lying. | Medium / possible. Cheap to check while writing. |
| R-8 | **Overlap with `tests/services/authRefreshSession.test.ts`.** That file covers the *client* `RefreshSession` dedup in `services/auth.ts` (Phase 9). The single-flight in `authRefresh.ts` is a different mechanism at a different layer with a similar name. Testing the same idea twice, or assuming one covers the other, is the trap. | Medium / possible. Named in the intake for exactly this reason. |
| R-9 | **`registerGuestForOtp` reaches the gateway.** It calls `fetch` directly against `GO_BACKEND_URL`. Under msw an unhandled request errors, and the function's own `catch` swallows it into `return null` — so a test could pass while silently doing the wrong thing. The env value must be a reserved unresolvable host (`.invalid`, as `tokenManager.test.ts` does) and the fetch stubbed or handled. | Medium / likely. Same failure mode as R-3: a test that cannot fail. |
| R-10 | **Five modules across two runtimes in one ticket.** `otpLocks` needs jsdom; the other four are cleanest under `// @vitest-environment node`. That is at least five test files and two environments — a real risk of the ticket sprawling past one focused outcome. | Medium / possible. `/spec` should either confirm the cut or split it (OQ-6). |

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Where do the three `utils/server/*` test files go — colocated (`utils/server/authRefresh.test.ts`) or in the `tests/utils/` mirror next to `tokenManager.test.ts`? | `utils/server/**` is **not** a protected glob, so the convention says colocate; but the nearest existing example sits in the mirror (because *its* subject was protected). Picking per-file by taste is how a suite stops being findable. |
| OQ-2 | How does the dedup test get a real memoization boundary, given R-1 — stand in `react`'s `cache` with a per-test Map, or wrap the calls in something that provides a cache dispatcher? | Without an answer the dedup test either fails against correct code or passes for the wrong reason. Standing in `cache` means the test proves *our* helper, not React's; that trade-off has to be stated, not assumed. |
| OQ-3 | How is `server-only` made resolvable (R-2) — a `resolve.alias` to an empty stub in `vitest.config.mts`, or `vi.mock("server-only", …)` in each file? | The alias is one line and helps every future phase (`utils/firebaseAdmin.ts` has the same import); the per-file mock keeps the config untouched. `vitest.config.mts` is not a protected path, but it is shared by every test in the repo. |
| OQ-4 | Is `registerGuestForOtp` (the `ensureUserId: true` branch of `resolveOtpIdentity`) in scope, or is it enough to cover the identity resolution and leave guest registration to the phase that owns the send-OTP action? | It is the only outbound call in `otpIdentity.ts` and the only branch that writes three cookies. Including it roughly doubles the file's test surface; excluding it leaves the riskiest branch uncovered. |
| OQ-5 | Which validation profile does `plan.md` name — `logic-change` (the profile that actually exists and matches: lint + typecheck + unit-tests) or the roadmap's `tests-and-types`, which is not defined in `.claude/project-config.yaml`? | `/verify` runs the profile named in the plan. Naming an id that does not exist means the gate silently checks nothing. |
| OQ-6 | Does this stay one ticket, or does the dedup helper (the only 🔒 module, and the only one needing the React-cache decision) split out? | Five modules, two runtimes, one protected path. The roadmap explicitly allows a re-cut at `/research`. Keeping it whole keeps the 🔒 obligations (mirror path in `plan.md`, protected-path statement in `verify.md`) on a ticket that is otherwise unprotected. |
| OQ-7 | Does the suite pin the current no-eviction behaviour of `dedupeRequest` — a rejected promise stays in the Map for the rest of the request — as a recorded finding, or is that branch left untested? | Rule 4 forbids fixing it here. Pinning it makes the behaviour deliberate and visible; leaving it out means a later "fix" looks like a free improvement with no test to argue with. |
| OQ-8 | Do the tests assert that `refreshMarketSession` picks the core backend for a verified shopper and the gateway for a guest — i.e. that they read the two env vars — without ever naming the backend technology in a test name or message? | The routing rule is the single most load-bearing line in the market path (a wrong pick logs the user out), but the stack-agnostic naming rule applies to test files too. Both matter; the phrasing has to be settled once. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- `node_modules` was read (React's `cache` implementation, `server-only`
  resolution) to confirm R-1 and R-2 rather than assume them. Nothing was
  installed or modified.
