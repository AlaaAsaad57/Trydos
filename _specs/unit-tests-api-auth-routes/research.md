---
ticket: unit-tests-api-auth-routes
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: ai_agent
updated: 2026-08-17
links:
  clickup:
  github:
---

# Research — unit-tests-api-auth-routes

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Cover the nine auth route handlers under `app/api/auth/` and the `send_otp` block
in `app/api/proxy/route.ts` with unit tests in the `tests/` mirror, changing no
production code.

## Relevant directories

- `app/api/auth/` — the handlers under test. Read in full; sizes are uneven:
  `login` 377, `expire` 186, `register-device` 135, `logout` 119, `update-user`
  107, `clear-tokens` 91, `refresh` 85, `me` 23, `wallet-token` 16. Total with
  `proxy` (276): **1,415 lines**. `simulate` (81) is out of scope by the intake
  decision.
- `app/api/proxy/` — one file. Only part of it is named by the roadmap (the
  `send_otp` 403), but the same file also holds the host-escape and path-escape
  guards, which are the reason those checks exist. See OQ-7.
- `tests/` — where every file goes, mirroring the source path. There is no
  `tests/app/` yet, so this ticket creates that branch of the mirror.
- `tests/mocks/` — the stand-ins this ticket needs already exist:
  `nextHeaders.ts` (cookie store with `__writes`, `__deletes`, `__lastWrite`,
  `__reset`), `mockFetch.ts` (`makeMockFetch`, `jsonReply`, `failureReply`).
- `tests/msw/` — the fake network. Its `proxyRoute()` helper matches calls the
  *client* sends to `/api/proxy`; it does not help here, because these tests call
  a handler directly and the handler's own outbound `fetch` goes to a backend
  address.
- `utils/server/`, `utils/cookies/` — every dependency the handlers import.
  `tokenManager`, `cookie-manager`, `authRefresh` and `tinyUtils` all have
  passing tests from phases 5, 6 and 8.
- `docs/testing/` — `UNIT_TEST_ROADMAP.md` (phase 10), `UNIT_TESTING.md` (the
  conventions), `LIVE_TEST_ROADMAP.md` (the suite this unblocks).

## Relevant config files

- `vitest.config.mts` — two projects, `unit` and `live`. Three things matter
  here: the `server-only` alias (a server module cannot load in a browser-like
  test), `isolatedEnv`, which holds **no backend base URL at all**, and
  `coverage.include`, which already names `app/**` — so this ticket adds nothing
  to it.
- `tests/setup.ts` — runs per test file. Registers the run-wide stand-ins for
  `next/navigation`, `serverActions/sendOtp` and `serverRequests/radis`, and
  starts msw with `onUnhandledRequest: "error"`. None of the handlers in scope
  imports the two server modules that are stood in, so nothing has to be lifted.
- `.claude/project-config.yaml` — `validation_profiles`. `logic-change` is the
  one this ticket fits: `lint`, `typecheck`, `unit-tests`. `features.observability`
  is `false` for this repository.
- `.github/workflows/tests.yml` — the pull-request gate. It picks up new tests on
  its own; this ticket does not touch it.
- `docs/testing/UNIT_TESTING.md` — the mocking rules, the `server-only`
  explanation, and the "what not to test" list.

## Possibly affected services

Nothing in the app changes. What the handlers reach, and what is already pinned:

- `utils/server/tokenManager.ts` — `SECURE_COOKIE_NAMES`, `SECURE_COOKIE_OPTIONS`,
  `REFRESH_COOKIE_OPTIONS`, `setSecureCookieJSON`, `deleteSecureCookie`,
  `getCurrentUser`, `isVerifiedMarketUser`, `buildProxyHeaders`,
  `getServerBaseUrl`, `isAllowedServer`, and the three sanitizers. Tested in
  phase 6 — a route test must assert the **handler's** decisions, not re-prove
  these.
- `utils/cookies/cookie-manager.ts` — `COOKIE_NAMES` and `HTTPONLY_COOKIE_NAMES`.
  The logout cleanup list is derived from the second one, so it is 13 names and
  includes the legacy `DEVICE-TOKEN`. `VISIT-ID` and `LOGOUT-GUARD` are
  deliberately **not** in it.
- `utils/server/authRefresh.ts` — `refreshMarketSession`, `refreshChatSession`,
  `refreshStoriesSession`. `refresh` and `expire` both branch on the outcome
  (`refreshed` / `ineligible` / other). Tested in phase 8.
- `utils/serviceTokens.ts`, `utils/endpointConfig.tsx`, `utils/fetch/Endpoints.ts`
  — the opaque service-name mapping and the paths.
- `utils/serverErrorReporter.ts` → Sentry. Must be stood in, the way
  `tests/utils/server/tokenManager.test.ts` already does, or a test reaches out.
- The **five backends** `login` calls: core (`BACKEND_URL`), chat, stories,
  comments and wallet. Four run in parallel through one `safeServiceLogin`
  helper that never throws — it returns `{success:false}` instead.
- The client callers, already tested, whose expectations these handlers must
  match: `services/auth.ts` (`tests/services/auth.session.test.ts`,
  `auth.profile.test.ts`, `auth.otp.test.ts`) and the 401 handler in
  `utils/fetchData.ts` (`tests/utils/fetchData.test.ts`), which is the only
  caller of `/api/auth/refresh`.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — the unit project once (`vitest run --project unit`).
- `pnpm test` — the same in watch mode.
- `pnpm test:coverage` — adds the v8 report; `app/**` is already included.
- `pnpm lint` — ESLint, including the i18n rules as errors.
- `pnpm exec next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` —
  the typecheck. `next-env.d.ts` is gitignored, so `tsc` alone fails on a fresh
  checkout.
- `pnpm lint:i18n-parity` — not needed here; these handlers ship no user-visible
  copy.
- `pnpm test:live` — the live project. Empty, and out of scope for this ticket.

## Risks and unknowns

- **No backend base URL exists in the test environment.** `isolatedEnv` in
  `vitest.config.mts` sets `NEXT_PUBLIC_CHAT_BACKEND_URL` and nothing else, so
  `BACKEND_URL`, `GO_BACKEND_URL`, `STORIES_BACKEND_URL`, `COMMENT_BACKEND_URL`,
  `WALLET_BACKEND_URL` and `WALLET_PUBLIC_API_KEY` are all `undefined`. Every
  handler that calls out would build `"undefined/auth/register-guest"`. There is
  a precedent for the fix: `tests/proxy.test.ts` and
  `tests/utils/server/tokenManager.test.ts` both pin values per file with
  `vi.stubEnv` and reserved `.invalid` hosts, and `proxy.test.ts` says why —
  a value added to the shared config is handed to every other file, including
  ones written later that never asked for it. See OQ-2.
- **`logout` uses `after()` from `next/server`.** The FCM detach is deferred
  until the response is flushed. Whether that callback runs at all when a test
  calls the handler directly is unknown, and the roadmap forbids changing the
  handler to make it testable. See OQ-4.
- **msw fails any unhandled request.** That is the safety net, and it also means
  an outbound call that is not stood in ends the test with an msw error rather
  than a useful one. Reserved `.invalid` hosts make the failure local either way.
- **`login` is the hard one.** Four parallel sub-service calls, each of which can
  fail independently, plus a legacy branch where the response carries no token
  pair and **nothing** may be written. The full cross-product is not worth
  writing; the spec has to name which combinations matter.
- **Overlap with already-tested helpers.** Most cookie *shape* assertions belong
  to phase 6 and are already green. This ticket's value is the handler's own
  choices: which cookies, in which order, under which branch, and what is left
  out of the body.
- **Two handlers register a guest.** `expire` step 3 and `register-device` both
  POST the same bodyless `/auth/register-guest`, with different surrounding
  behaviour (`expire` nukes first and reports `wasVerified`;
  `register-device` clears the nine sub-service cookies only when a token comes
  back). They are easy to conflate in one test file.
- **The 🔒 mark is a project convention, not a plugin rule.** The plugin's GU-2 /
  IM-5 / TR-3 are about `observability/**`, and this repository sets
  `features.observability: false`. CLAUDE.md's own protected runtime paths are
  `proxy.ts`, `next.config.ts`, `instrumentation*`, `sentry.*.config.ts` and
  `.github/workflows/**` — `app/api/auth/**` is not among them; it is protected
  by the **unit roadmap's** glob list. Nothing in this ticket writes to any of
  them in any case. See OQ-8.
- **`request.formData()` in the proxy handler** depends on the runtime's
  multipart parsing. A `send_otp` test never reaches that line, but a wider proxy
  scope (OQ-7) would.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | One test file per handler (10 files), or grouped by behaviour — e.g. one file for the two guest-registration paths (`expire`, `register-device`), one for the cookie-clearing pair (`logout`, `clear-tokens`)? | Decides the shape of the whole deliverable and whether the ticket stays one ticket. `unit-tests-auth-service` covered a comparable size with three files. |
| OQ-2 | Are the six missing backend env values pinned per file with `vi.stubEnv`, or added to `isolatedEnv` in `vitest.config.mts`? | Nothing calls out successfully without them. The per-file precedent exists and is argued for in `tests/proxy.test.ts`; the config route changes a shared file every other suite reads. |
| OQ-3 | Is the handler's outbound call stood in with `makeMockFetch` (replacing global `fetch`) or answered by an msw handler? | `makeMockFetch` records calls and is what `proxy.test.ts` uses; msw keeps the real `fetch` path running. The two give different evidence, and mixing them per file would make the suite hard to read. |
| OQ-4 | Does `after()` run when the logout handler is called directly in a test — and if it does not, is the FCM detach a recorded finding rather than a covered path? | It is the only deferred work in scope. Roadmap rule 4 forbids reshaping the handler to make it testable, so the answer decides whether the detach is asserted or explicitly written off. |
| OQ-5 | What exactly must `login` mint, and which of the four sub-service failure combinations are worth a test? | The intake deliberately left this to be read from the code. It is now read: seven cookies from `tokensToSet` (only when the value is truthy), `MARKET-REFRESH-TOKEN` when the verify response carries one, plus up to four JSON blobs — `User-Data`, `USER-CHAT`, `USER-STORIES`, `WALLET_USER`. The live roadmap's "about ten cookies" is therefore a ceiling, not a fixed count, and the spec must say which subset each test asserts. |
| OQ-6 | Is "no response body, header or error string names the backend technology" asserted, and on which responses? | It is one of the roadmap's three draft criteria and a stated security rule. `docs/security/backend-disclosure-decisions.md` D3/D4 already decided the header and identifier side; the code comments in `login` and `expire` still use the old technology names, and those are comments, not output. |
| OQ-7 | Does `app/api/proxy/route.ts` get only the `send_otp` 403, or also its host-escape / path-escape guards and the identical-503 masking? | The roadmap names only the `send_otp` block. The surrounding guards are the highest-value security behaviour in that file and are untested, so leaving them silently uncovered is a decision worth making on purpose. |
| OQ-8 | Which protected-path statement does `plan.md` / `verify.md` carry, given the plugin's rule is about `observability/**` and this repo has none? | The roadmap marks phase 10 🔒 and requires the statement (TR-3). Writing a statement about a rule that does not apply here would be noise; saying nothing would break the roadmap's own convention. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
