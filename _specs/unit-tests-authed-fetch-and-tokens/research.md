---
ticket: unit-tests-authed-fetch-and-tokens
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-11
links:
  clickup:
  github:
---

# Research — unit-tests-authed-fetch-and-tokens

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Write isolated unit tests for the server-side token plumbing — how a server
request gets a token, what happens when that token is rejected, and how the auth
cookies are read, written and shaped.

## Headline finding — the roadmap is out of date

`docs/testing/UNIT_TEST_ROADMAP.md` describes the 401 path as "one guest
registration and one retry". **The code no longer works that way.** The roadmap
allows for this: "if `/research` finds the scope is wrong, re-cut it in that
ticket."

`HandleAuthedFetch.ts` now has **five** outcomes for a 401, in this order:

1. **Logout in progress** — if the `LOGOUT-GUARD` cookie is set, return the 401
   untouched. No token is minted. This is what stops a late 401 from bringing a
   logged-out session back to life (`HandleAuthedFetch.ts:68-75`).
2. **Cookies not writable** — re-set the current token as a probe. In a pure
   Server Component render this throws, so the 401 is returned unchanged and the
   client side handles recovery. The probe runs *before* anything single-use is
   spent (`:77-101`).
3. **A refresh cookie exists** — call `refreshMarketSession()`, which
   single-flights the exchange and writes both cookies. On success, retry once
   with the new token. On anything else, return the 401. **No guest registration
   happens on this path at all** (`:108-128`).
4. **A verified shopper with no refresh cookie** — return the 401. Registering a
   guest here would quietly downgrade a real account (`:134`).
5. **No refresh cookie and not verified** — bodyless register-guest, clear the
   seven sub-service cookies, write the new token pair and user data, then retry
   once (`:136-180`).

Only outcome 5 is the behaviour the roadmap's draft criterion describes. The
criteria this ticket runs on have to be rewritten around all five.

## Relevant directories

- `serverRequests/` — phase 5 targets. `HandleAuthedFetch.ts` carries
  `"use server"` at line 1, so it sits on the boundary that `tests/setup.ts`
  already had to cut for other modules.
- `utils/cookies/` — `cookie-manager.ts`: the cookie name constants, the
  HttpOnly set, and the client-side get/set/delete helpers.
- `utils/server/` — `tokenManager.ts`: cookie options, secure cookie read and
  write, per-service token lookup, backend URL resolution. Also holds
  `authRefresh.ts`, which is **not** in scope but which phase 5 now depends on.
- `tests/` — the harness from roadmap phases 1–3: `fixtures/`, `mocks/`, `msw/`,
  `render.tsx`, `setup.ts`.
- `docs/testing/` — the conventions (`UNIT_TESTING.md`) and the roadmap.

## Relevant config files

- `vitest.config.mts` — jsdom, `globals: true`, `setupFiles: ./tests/setup.ts`,
  a `test.env` block of deliberately fake values, and a `coverage.include` that
  is now **whole directories** (`serverRequests/**`, `utils/**`, …), not the
  explicit per-phase list roadmap rule 3 describes.
- `tests/setup.ts` — starts msw with `onUnhandledRequest: "error"`, and replaces
  `next/navigation`, `serverActions/sendOtp` and `serverRequests/radis` for the
  whole run. It does **not** replace `next/headers`; each test file asks for that
  itself.
- `.claude/project-config.yaml` — `validation_checks` (`lint`, `typecheck`,
  `i18n-parity`, `unit-tests`, `build`) and `validation_profiles` (`ui-change`,
  `logic-change`, `full`).
- `CLAUDE.md` — the authoritative list of protected runtime paths.
- `package.json` — the test scripts.

## Possibly affected services

No production service is touched: this ticket adds test files only. What the
code under test reaches, and therefore what every test must fake:

- **The gateway** — guest creation (`/auth/register-guest`) is pinned to
  `GO_BACKEND_URL` (`HandleAuthedFetch.ts:141`).
- **The core backend** — `getServerBaseUrl` sends verified shoppers to
  `BACKEND_URL` and guests to the gateway, per URL allow-list.
- **The auth cookie contract** — `MARKET-TOKEN`, `MARKET-REFRESH-TOKEN`,
  `User-Data`, `LOGOUT-GUARD`, and the seven sub-service cookies cleared on guest
  re-registration.
- **Sentry** — `LogError` and `LogServerError` are called on failure paths.
  `tests/mocks/sentry.ts` exists for this.

## Test / validation commands available

Listed, not run.

| Command | What it checks |
|---|---|
| `pnpm test:run` | The whole suite once. |
| `pnpm test` | Watch mode. |
| `pnpm test:coverage` | Suite plus the coverage report. |
| `pnpm lint` | ESLint, including the i18n rules. |
| `node_modules/.bin/tsc --noEmit --pretty false` | Types only. |
| `pnpm lint:i18n-parity` | Translation files stay key-parallel. |
| `pnpm build` | Production build; catches server/client boundary errors. |

The matching profile is **`logic-change`** (lint + typecheck + unit-tests). See
OQ-6 — the roadmap names a profile that does not exist.

## Risks and unknowns

| # | Risk | Impact / likelihood |
|---|---|---|
| R-1 | The cookie stand-in cannot express what phase 6 must assert. `tests/mocks/nextHeaders.ts:37` defines `set(name, value)`, but every caller uses the object form `set({ name, value, ...options })`. Options are dropped on the floor, and the key written is the object itself. | High / certain. Without extending it, "assert HttpOnly, expiry and SameSite" cannot be written at all. |
| R-2 | The same stand-in never throws, so the "cookies not writable" probe (outcome 2) cannot be reached. | High / certain. That is one of the five 401 outcomes. |
| R-3 | Phase 5 depends on `refreshMarketSession()` from `utils/server/authRefresh.ts` — a **phase 8** module, out of scope here. | High / certain. Outcome 3 cannot be tested without deciding how to handle it (OQ-3). |
| R-4 | **No JWT parsing exists** in either phase-6 file. The roadmap criterion "a valid, an expired and a malformed token" has no code behind it. `jsonwebtoken` is imported at `cookie-manager.ts:1` and never used. | High / certain. The criterion has to be dropped or redefined (OQ-5). |
| R-5 | `cookie-manager.ts:3-11` loads `next/headers` through `require()` inside a `try`. Under the test runner this may fail quietly and leave `cookies = null`, so `getCookieServer` always returns `null` and looks like it passes. | Medium / likely. A test that does not guard against this proves nothing. |
| R-6 | `test.env` sets **no** `BACKEND_URL` and no `GO_BACKEND_URL`. The register-guest URL therefore builds as the literal string `undefined/auth/register-guest`. | Medium / certain. Either add fake values or match that string in the handler (OQ-7). |
| R-7 | `ServerFetch.tsx` retries 502/503/504/429 three times with real `setTimeout` backoff, and arms `AbortSignal.timeout(15000)`. A test that walks this path waits real time. | Medium / likely. Needs fake timers or per-call parameters, plus an explicit test timeout. |
| R-8 | `requestDedup.ts` is built on React `cache()`, which only memoizes inside a render pass. Outside one, two calls may not collapse. | Medium / unknown. May be untestable as a unit; would then be a recorded finding, not a fix. |
| R-9 | `HandleAuthedFetch.ts` is a `"use server"` module. Roadmap phase 3 already found that importing across this boundary in tests pulls in `next/headers` and `ioredis`. | Medium / likely. `tests/setup.ts` cuts two such chains already; a third may be needed. |
| R-10 | The retry logic is exactly where an endless loop hides. | Low / high impact. Every test file here needs its own time limit rather than the default. |
| R-11 | `coverage.include` is now repo-wide, so the coverage number no longer describes "what was tested on purpose" the way roadmap rule 3 assumes. | Low / certain. Worth stating; not this ticket's job to change. |

## Findings to record, not to fix

Roadmap rule 4 and the repo's standing rule: tests never change the code under
test. These are reported, and any fix is its own ticket.

- **F-1 — the backing technology is named in scope files.** `CLAUDE.md` forbids
  this and lists these very names as the bad examples. Present:
  `GO_APIS`, `GO_API_PREFIXES`, `isFromGoApi` (`tokenManager.ts:78-128`),
  `backend: verified ? "laravel" : "go"` in a `console.log`
  (`tokenManager.ts:164-169`, `:186-192`), `GO_BACKEND_URL`, and comments naming
  Go and Laravel (`HandleAuthedFetch.ts:74`, `:104-107`, `:139`).
- **F-2 — dead import.** `jsonwebtoken` is imported at `cookie-manager.ts:1` and
  never used anywhere in the file.
- **F-3 — the routing log runs outside production.** `tokenManager.ts:164` and
  `:186` print the backend name whenever `NODE_ENV !== "production"`.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Are `serverRequests/**` and `utils/cookies/**` protected paths? `CLAUDE.md` — the authoritative contract — lists only `proxy.ts`, `next.config.ts`, the instrumentation and Sentry configs, and `.github/workflows/**`. The roadmap lists a longer set and marks both phases 🔒. | Decides whether test files are colocated (the default) or go in a `tests/` mirror, and whether the protected-path statement is required in `verify.md`. |
| OQ-2 | Which acceptance criteria govern this ticket — the roadmap's stale one, or new ones covering all five 401 outcomes? | The roadmap criterion describes one of five branches. Testing only it would leave the refresh path, the logout guard, the writability probe and the verified-user guard uncovered. |
| OQ-3 | How is `refreshMarketSession()` (phase 8, out of scope) handled — replaced with a stand-in, or pulled into scope? | Outcome 3 is the most common real 401 path. A stand-in keeps this ticket small; pulling it in grows scope by 301 lines. |
| OQ-4 | May `tests/mocks/nextHeaders.ts` be extended to accept the object form of `set`, record the options, and optionally throw? | Without it, R-1 and R-2 make two of the ticket's criteria unwritable. It is a harness file, not code under test, so rule 4 does not forbid it — but it is a shared file other phases already use. |
| OQ-5 | The "valid, expired, malformed token" criterion has no code behind it. Drop it, or redefine it as cookie-option and cookie-name assertions? | Keeping it as written would mean writing a test for something that does not exist. |
| OQ-6 | Which validation profile does `plan.md` name? The roadmap says `tests-and-types`, which is **not** in `.claude/project-config.yaml`. The closest real profile is `logic-change` (lint + typecheck + unit-tests). | `plan.md` must name at most one real profile, or `/wf:verify` has nothing to run. |
| OQ-7 | Add fake `BACKEND_URL` and `GO_BACKEND_URL` to `vitest.config.mts > test.env`, or match the literal `undefined/...` URL in the msw handler? | Adding them is clearer and matches how the other fake values are handled, but it edits a shared config file. |
| OQ-8 | Are F-1, F-2 and F-3 recorded as findings only, with no code change in this ticket? | Confirms the ticket stays a test-only change and that the naming rule violations are not quietly fixed here. |
| OQ-9 | How is the retry timing in `ServerFetch.tsx` handled — fake timers, or per-call `retryAttempts`/`retryDelay`/`requestTimeout` parameters? And what explicit test timeout do these files carry? | Wrong choice means either slow tests or tests that hide an endless loop. |
| OQ-10 | Is `requestDedup.ts` testable outside a render pass, or is that a recorded finding? | It is 32 lines and built entirely on React `cache()`. If it cannot be tested honestly, saying so beats a test that asserts nothing. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
