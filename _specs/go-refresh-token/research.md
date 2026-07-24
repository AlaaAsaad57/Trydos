---
ticket: go-refresh-token
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: ai_agent
updated: 2026-07-23
links:
  clickup:
  github:
---

# Research — go-refresh-token

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Integrate the Go backend's guest-auth + refresh-token contract
(`Guest-Authentication-&-Token-Renewal.md`, repo root): store the refresh
token, exchange it on 401 (single-use rotation), fall back to `register-guest`
when refresh fails, and drop `old_guest_user_id` — after first reverting
commit `c4796b9b` (temporary all-traffic-to-Laravel redirect).

## Relevant directories

- `serverRequests/` — `HandleAuthedFetch.ts` is the server-side 401 handler:
  today 401 → `register-guest` (with `old_guest_user_id`) → set cookies
  (best-effort; silently no-ops during pure RSC render) → retry. This is the
  primary server-side site where "401 → refresh first, register-guest as
  fallback" must land. **Protected path.**
- `app/api/auth/` — route handlers touched by the flow. **Protected path.**
  - `expire/route.ts` — client-triggered token-expiry recovery: clears
    MARKET/CHAT/STORIES tokens, flags chat/stories `need_auth`, downgrades
    `User-Data` (`is_phone_verified: 0`), then `register-guest`. With a valid
    refresh token this session-nuke should be preceded by a refresh attempt.
  - `register-device/route.ts` — `register-guest` proxy for the client
    (called by `services/home.ts:182,405`); sets `MARKET-TOKEN` + `User-Data`.
  - `login/route.ts` — calls Go `verify_otp_from_guest` (via
    `utils/fetch/Endpoints.ts > VERIFY_OTP_ENDPOINT`); its response will now
    also carry a refresh token that must be stored.
- `utils/server/` —
  - `tokenManager.ts` — cookie options (`SECURE_COOKIE_OPTIONS`, 48h
    `TOKEN_COOKIE_MAX_AGE` default), `SECURE_COOKIE_NAMES` purge list, and the
    Go/Laravel routing (`getMarketFetchBase`, `getServerBaseUrl`,
    `isFromGoApi` allow-list) currently **forced to Laravel by `c4796b9b`**.
  - `otpIdentity.ts` — `registerGuestForOtp()` (4th `register-guest` call site).
- `utils/cookies/cookie-manager.ts` — canonical `COOKIE_NAMES` +
  `HTTPONLY_COOKIE_NAMES`; a new refresh-token cookie name must be added here.
  **Protected path.**
- `services/` — `auth.ts` (`ExpiredUser()` → `/api/auth/expire`, deduped via
  `_expirePromise`; `VerifyOtp` path), `home.ts` (register-device calls).
  `services/auth.ts` is a **protected path**.
- `utils/fetchData.ts` — client fetch: on 401 `handleUnauthorized()` waits for
  in-flight re-auth, seller flow surfaces the re-verify widget, otherwise
  `ExpiredUser()` then retries once (`isRetryAfterUnauthorized`).
- `utils/endpointConfig.tsx`, `utils/fetch/Endpoints.ts` — endpoint constants
  (`REGISTER_DEVICE_URL = "/auth/register-guest"`, `VERIFY_OTP_ENDPOINT`);
  the new `/auth/refresh-token` constant belongs here.

## Relevant config files

- `.claude/project-config.yaml > protected_paths` — `proxy.ts`,
  `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`,
  `services/auth.ts` are all protected; nearly every file this ticket touches
  is on the list, so `plan.md` must enumerate them explicitly (GU-2 / IM-5).
- **Env vars** (server-side): `GO_BACKEND_URL` (Go base), `BACKEND_URL`
  (Laravel base), `TOKEN_COOKIE_MAX_AGE` (token-cookie TTL override, default
  48h), plus per-service `*_BACKEND_URL` for chat/stories/comments/wallet
  (out of scope — unchanged).
- `Guest-Authentication-&-Token-Renewal.md` (repo root, untracked) — the
  behavioral contract: endpoints, 24h access / 30d rotating refresh, scenarios
  1–9, mobile/app integration checklist.
- `go-refresh-api-contract.md` (repo root, gitignored) — **authoritative API
  contract** (provided 2026-07-23). Key facts:
  - Base URL `/api/v1`; headers `Lang` / `Country` (optional); standard
    envelope `{isSuccessful, code, hasContent, message, detailed_error, data,
    request_id}`.
  - `POST /api/v1/auth/register-guest` — **no request body at all** (no
    `old_guest_user_id`, no re-issue-by-id path); returns
    `data.{token, expires_at, refresh_token, user}`.
  - `POST /api/v1/auth/refresh-token` — public, body
    `{"refresh_token": "..."}`; success returns the same
    `data.{token, expires_at, refresh_token, user}` shape; **401 is uniform**
    (malformed/expired/used/revoked/inactive) → fall back to register-guest.
    `Lang`/`Country` headers update the stored locale on refresh.
  - `POST /api/v1/auth/phone/verify_otp_from_guest` — **POST with JSON body
    `{verificationId, otp}`** and Bearer auth; success returns
    `data.{already_exists, Logged_in_from_another_device, id_token, user_type,
    token, expires_at, refresh_token, user}`. A legacy branch (OTP server
    disabled) returns the `phone_verifications` record with **no token pair**.
  - Refresh tokens are opaque single-use blobs; access-token revocation is
    not instant (stateless JWT until TTL).
- Commit `c4796b9b` — the revert target; it swapped `GO_BACKEND_URL` →
  `BACKEND_URL` in 8 files (`app/api/auth/{expire,login,register-device}`,
  `app/api/internal/mobile-error-log`, `serverRequests/HandleAuthedFetch.ts`,
  `utils/server/{mobileErrorLog,otpIdentity,tokenManager}.ts`) and forced
  `getMarketFetchBase` / `getServerBaseUrl` (market + market-dashboard) to
  Laravel. A clean `git revert c4796b9b` restores verified→Laravel /
  guest→Go routing (PR #80 behavior).

## Possibly affected services

- **Go market backend** — gains the three auth endpoints
  (`register-guest`, `refresh-token`, `verify_otp_from_guest`); all guest
  traffic returns to it after the revert.
- **Laravel market backend** — shares the DB and token tables
  (Passport-compatible) but has **no refresh endpoint yet**; verified users'
  market traffic routes to it, so 401s from Laravel must still be refreshed
  against the **Go** endpoint.
- **chat / stories / comments / wallet** — explicitly unchanged: their 401 →
  `need_auth` / verify-phone flow stays. Note `app/api/auth/expire` clears
  `CHAT-TOKEN`/`STORIES-TOKEN` and flags `need_auth` as a side effect — a
  successful refresh should not trigger that nuke.
- **Mobile apps** — same Go contract (store pair, refresh on 401, fallback to
  register-guest, stop sending `old_guest_user_id`); web and mobile must stay
  behaviorally consistent.
- **Seller dashboard** — `fetchData` seller 401 path (re-verify widget) sits
  on top of `ExpiredUser()`; a refresh-first step changes when that widget
  appears.

## Test / validation commands available

- `pnpm lint` — ESLint incl. i18n key enforcement (errors on missing ar/tr/ku keys).
- `pnpm lint:i18n-parity` — translation-file parity check.
- `pnpm build` — production build (type-checking; catches server/client
  boundary violations, e.g. `next/headers` in client graphs).
- `pnpm knip` — unused files/exports/deps.
- No automated test suite by policy — manual scenario walkthrough (doc
  scenarios 1–9) is the functional validation; staging environment, no
  rollback plan required per intake.

## Risks and unknowns

- **Single-use rotation vs concurrent requests (highest risk).** Refresh
  tokens are single-use with a DB lock: two parallel 401s racing the same
  refresh token → the loser gets 401 and, naively, falls back to
  `register-guest`, destroying the session the winner just renewed. Client
  side has dedup (`_expirePromise`, `isRegisteringReady`); **server side
  (`HandleAuthedFetch`) has no cross-request dedup** — parallel RSC fetches
  during one render can all see 401.
- **Cookie writes no-op during pure RSC render.** Today a lost token is
  recoverable — `register-guest` with `old_guest_user_id` re-issues a token
  for the **same** user, so the session survives (that insecure re-issue path
  is exactly what the new contract removes); with rotation a loss is
  destructive: a refresh executed during render
  consumes the single-use token but cannot persist the new pair → the stored
  refresh token is dead on the next request → forced re-guest. Where the
  refresh exchange runs (route handler / server action vs render) is a core
  design decision for `/plan`.
- **Refresh-cookie lifetime.** `SECURE_COOKIE_OPTIONS.maxAge` defaults to 48h
  (deliberately short for the access JWT). The refresh cookie must live ~30d
  (renewed on every rotation) — it needs its own cookie options, name in
  `COOKIE_NAMES`, membership in `HTTPONLY_COOKIE_NAMES` +
  `SECURE_COOKIE_NAMES` (logout purge), and must respect the
  `LOGOUT_GUARD` semantics.
- **`old_guest_user_id` removal.** Four call sites still send it, plus the
  "The user does not exist." retry ladder built around it. The contract is
  final: `register-guest` takes **no body** — the field and the retry ladder
  are obsolete against Go and must be removed wholesale.
- **`verify_otp_from_guest` method change.** Current
  `app/api/auth/login/route.ts` calls it as a **GET with query params**
  (`?verificationId=&otp=&name=`); the contract specifies **POST with a JSON
  body `{verificationId, otp}`** — and no `name` field. The login route needs
  a method/shape migration, and the fate of the `name` param must be
  clarified.
- **Legacy OTP branch without tokens.** When the OTP server is disabled, the
  verify response is a bare `phone_verifications` record with **no token
  pair** — the login route must not assume `data.token` exists.
- **Protected paths everywhere** — the implementation footprint is almost
  entirely inside `protected_paths`; scope discipline (IM-4/IM-5) matters.
- **Verified-user / non-allow-list Laravel 401s** — decided (user,
  2026-07-23): Laravel-routed 401s do **not** trigger the refresh exchange;
  they keep today's recovery flow (re-register / verify-phone). Refresh is
  scoped strictly to Go-routed 401s. The 401 handler therefore needs to know
  which backend served the failed request — a routing-awareness requirement
  for the design.
- **Later all-services adoption** — chat/stories/comments/wallet will
  eventually join; the refresh logic should live in one shared helper (not be
  copy-pasted per call site) so later adoption is a wiring change, not a
  redesign.
- **Laravel refresh will differ (per user, 2026-07-23).** Laravel keeps its
  current behavior for now; when it later gains a refresh flow it **may use a
  different endpoint and/or request/response shape** than Go. The shared
  helper must therefore be backend-aware (per-backend endpoint + shape
  adapter, Go being the first/only entry), never a hardcoded single Go call
  masquerading as generic.

## Open questions

> Most earlier questions were **answered by `go-refresh-api-contract.md`**
> (authoritative, provided 2026-07-23): request/response shapes, field name
> `refresh_token`, refresh body `{"refresh_token"}`, uniform 401 → fall back
> to register-guest, register-guest takes no body. Remaining:

- **Path prefix:** contract base is `/api/v1`; code appends
  `/auth/register-guest` to `GO_BACKEND_URL` — confirm the env value already
  carries `/api/v1` so constants stay prefix-free.
- **Staging readiness:** are the three endpoints live on staging behind the
  current `GO_BACKEND_URL`?
- **`name` param on verify:** the current login route forwards an optional
  `name` query param to verify_otp; the contract body has only
  `{verificationId, otp}` — is `name` dropped server-side, or sent elsewhere?
- **Race policy:** on refresh 401 caused by a concurrent winner (not expiry),
  is immediate `register-guest` fallback acceptable, or should the loser
  re-read the cookie / wait-and-retry before falling back? (Contract says
  "treat any 401 as re-login required", but the racing-tab case deserves an
  explicit decision at `/plan`.)

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
