---
ticket: go-refresh-token
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-23
links:
  clickup:
  github:
---

# Implement — go-refresh-token

> Record of what was actually built, following `plan.md` (revision 2).

## Changes made

**Preconditions verified before any change:**
- `GO_BACKEND_URL` ends with `/api/v1` in `.env.development` and
  `.env.production` — the plan's prefix assumption holds; constants stay
  prefix-free.
- Staging probe: `POST /auth/refresh-token` (dummy token) → **401** (uniform
  invalid, per contract), `POST /auth/register-guest` (no body) → **200** —
  both endpoints live; the bodyless contract is deployed.

**Step 1 — revert `c4796b9b`** (`git revert --no-commit`, then unstaged):
restored `GO_BACKEND_URL` in the 8 files below and the user-based Go/Laravel
routing in `tokenManager.ts` (`getMarketFetchBase`, `getServerBaseUrl` market +
market-dashboard).

**Steps 2–10 — per file:**
- `utils/cookies/cookie-manager.ts` ⚠ — `MARKET_REFRESH_TOKEN:
  "MARKET-REFRESH-TOKEN"` added to `COOKIE_NAMES` (documented) and
  `HTTPONLY_COOKIE_NAMES`.
- `utils/server/tokenManager.ts` — (revert) + `REFRESH_COOKIE_OPTIONS` (30d,
  re-set on every rotation; SameSite=strict) + `MARKET_REFRESH_TOKEN` in
  `SECURE_COOKIE_NAMES` (logout/clear-tokens purge it automatically) +
  exported.
- `utils/fetch/Endpoints.ts` — `REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token"`.
- `utils/server/authRefresh.ts` **(new)** — shared backend-aware helper:
  `REFRESH_BACKENDS` adapter registry (sole entry `go`: baseUrl, endpoint,
  buildBody `{refresh_token}`, envelope parse), module-scope single-flight,
  unconditional gates (LOGOUT_GUARD, `isVerifiedMarketUser()` → `ineligible`),
  `Lang`/`Country` headers from the LOCAL cookie, outcome union
  `refreshed | no-token | invalid | ineligible | unavailable` (no retry on
  5xx/network; upstream 401 **never** deletes the cookie — snapshot can't see
  a concurrent winner), persists both cookies + `User-Data` on success; plus
  `isMarketAccessTokenExpired()` (local JWT-exp check, 60s skew). No token
  values logged.
- `app/api/auth/refresh/route.ts` **(new)** ⚠ — POST; logout-guard no-op;
  reactive `{url, server}` eligibility via `isFromGoApi` (market /
  market-dashboard only; verified-half enforced in the helper) →
  `{eligible: false}`; proactive fast no-op while the access token is valid;
  success → `{refreshed: true}` with cookies on the response and **no token
  material in the body**; all failures → 401.
- `serverRequests/HandleAuthedFetch.ts` ⚠ — (revert) + rewritten 401 block:
  cookie-writability probe first (non-writable RSC render → return the 401
  unchanged); Go-base gate (`options.url.startsWith(GO_BACKEND_URL)`,
  non-Go → 401 unchanged, FR-8); refresh cookie present →
  `refreshMarketSession()` + single retry (refresh-401 → return 401, never
  register-guest while a cookie exists); no refresh cookie → **bodyless**
  register-guest (ladder removed), persists token + `refresh_token` +
  `User-Data`, single retry. `old_guest_user_id` and the `UserData`
  interface / `getCookieServer` usage removed.
- `app/api/auth/expire/route.ts` ⚠ — (revert) + last-chance refresh before
  any nuke (helper-gated: guest/Go-eligible only) → `{renewed: true,
  expired: false}` with no session nuke / no `need_auth` flags / no
  verification downgrade; nuke path now also deletes
  `MARKET_REFRESH_TOKEN` (only after the last-chance failed); bodyless
  register-guest (no `old_user_id` body read, ladder removed); persists
  `refresh_token`; response strips `token` **and** `refresh_token`.
- `app/api/auth/register-device/route.ts` ⚠ — (revert) + bodyless
  register-guest, ladder removed; persists `refresh_token`; response strips
  `refresh_token`; dropped the unused `isFromGoApi` import.
- `app/api/auth/login/route.ts` ⚠ — (revert) + contract-conformant verify:
  `POST` to `VERIFY_OTP_ENDPOINT` with body `{verificationId, otp}` only
  (query params and `name` dropped; `name` still feeds sub-service logins);
  added `Lang`/`Country` headers; **legacy-branch guard** (no
  `data.token`/`data.user` → return response untouched, stored tokens kept —
  AC-8); persists `refresh_token` (30d options); response strips
  `refresh_token`; removed a `console.log(otp_response)` that logged the full
  token pair (NFR-3).
- `utils/server/otpIdentity.ts` — (revert) + `registerGuestForOtp()` bodyless
  (ladder removed) and persists `refresh_token` (same best-effort try/catch).
- `utils/fetchData.ts` — `isRetryAfterUnauthorized` boolean → `authAttempt`
  counter (cap 2; internal `isRetryAfterUnauthorized = authAttempt > 0`
  preserves the cache/in-flight semantics); refresh-first block in
  `handleUnauthorized` (market/market-dashboard, attempt 0 only, after the
  re-auth/registration wait guards): `RefreshSession(url, server)` —
  `eligible` → single retry (doubles as jar-retry when the exchange failed);
  `{eligible: false}` → today's flow unchanged (seller widget / ExpiredUser).
- `services/auth.ts` ⚠ — `RefreshSession(url?, server?)` with `_refreshPromise`
  in-flight dedup (mirrors `_expirePromise`); `_doExpire` now reads the expire
  response: `{renewed: true}` → **skip** `cancelAuth`/`"cancelled"`, signal
  `reAuthResult: "success"` **only when `shouldAuthinticated` isn't armed**
  (never releases a phone re-verify wait), re-sync via the callers' own
  retries; dropped the `old_user_id` request body.
- `services/home.ts` — `registerForExpire()` / `RegisterDevice()` bodyless
  (unused `id` param removed); `CheckLogin()` leads with the proactive
  `RefreshSession()` and returns `true` when the session was rotated.
- `components/Home/Init.tsx` — awaits `CheckLogin()`; on a proactive rotation
  calls `router.refresh()` to refetch server-rendered content (self-heal).
- `app/api/internal/mobile-error-log/route.ts`, `utils/server/mobileErrorLog.ts`
  — revert only (back to `GO_BACKEND_URL`), no further edits.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

All 16 files above are uncommitted working-tree edits on branch
`ticket/go-refresh-token` (created from clean `develop`): 8 reverted (6 of
them further edited), 2 new (`utils/server/authRefresh.ts`,
`app/api/auth/refresh/route.ts`), 6 modified.

## Deviations from plan

- **Server-side register-guest fallback scoped to Go-base requests** (step 6
  wording ambiguity resolved conservatively): a Laravel-routed 401 in
  `HandleAuthedFetch` returns unchanged even when no refresh cookie exists —
  client-driven recovery owns verified/Laravel sessions (FR-8/AC-9). The
  bodyless fallback runs only for Go-base requests with no refresh cookie.
- **Accepted review dispositions applied** (round-3 panel): renewed branch
  signals only expire-waiters and uses the retries as the single re-sync
  mechanism (no `CheckLogin()`/`router.refresh()` from `_doExpire`); the raw
  client `{url}` is never fetched/redirected/logged; the Laravel
  `{eligible: false}` extra round trip (per-401, preserves single-source
  routing) is noted here as agreed.
- **Removed a token-logging `console.log`** in the login route (not itemized
  in plan steps, but required by NFR-3 and inside a planned file).
- Otherwise none — all 16 planned files changed, no unplanned files touched.

## Validation run during implementation

- Staging probes (pre-change): refresh-token → 401 uniform; register-guest
  (bodyless) → 200. Endpoints live.
- `pnpm exec tsc --noEmit` — **pass** (no type errors).
- `pnpm exec eslint <all 14 TS/TSX changed files>` — **0 errors**; 2
  pre-existing warnings (`import/no-anonymous-default-export` in
  `services/auth.ts` / `services/home.ts`, present on `develop`).
- `grep old_guest_user_id|old_user_id` over `*.ts,*.tsx` — **zero senders**
  remain (only explanatory comments) — AC-6.
- Full `full-build` profile (typecheck + lint + production build) and the
  manual scenario walkthrough are `/verify`'s job.
