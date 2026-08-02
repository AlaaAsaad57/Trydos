---
ticket: go-refresh-token
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-23
links:
  clickup:
  github:
---

# Plan — go-refresh-token

> Decide the approach before changing code. Plan only — no implementation here.
> **Revision 2** — revision 1 addressed round-1 follow-ups 1–7; this revision
> additionally addresses round-2 follow-ups 1–3 (see "Revision — follow-ups
> addressed" at the end).

## Approach

Revert `c4796b9b` to restore user-based Go/Laravel routing, then build the
refresh flow around **one shared, backend-aware server helper** consumed from
two entry points: an internal route handler `/api/auth/refresh` (client-side
recovery + proactive on-load check) and `HandleAuthedFetch` (server-side 401
recovery). The helper holds a per-backend adapter registry (Go is the only
entry; Laravel later — NFR-4) and an in-flight single-flight guard. Refresh is
scoped to **Go-served 401s only** (FR-3/FR-8), decided everywhere by the
**same existing routing helpers** (`isVerifiedMarketUser` + `isFromGoApi` —
the exact logic `getServerBaseUrl` applies): in `HandleAuthedFetch` by
comparing the resolved base URL against `GO_BACKEND_URL`; for client-triggered
recovery, the `/api/auth/refresh` route receives the failed request's
`{url, server}` and applies those same helpers server-side, answering
`{eligible: false}` for Laravel-served requests (no new header, no client-side
duplication of routing logic — single source of truth preserved).

Safety rules (NFR-1/NFR-2 — reworked per review):

1. **Never consume the single-use refresh token where the result can't be
   persisted.** `HandleAuthedFetch` probes cookie-writability first (re-set
   the existing `MARKET-TOKEN` to its current value inside try/catch); in a
   non-writable context (pure RSC render) it skips refresh entirely and
   returns the 401 — recovery belongs to the client layer below.
2. **Races resolve toward the browser's cookie jar, never against it.**
   Per-request `cookies()` snapshots cannot observe a concurrent winner, so:
   *no server-side path ever falls back to register-guest because a refresh
   returned 401* — a server-side refresh-401 simply returns 401 to the
   client. Client-side, a failed refresh **retries the original request once
   with the browser's current cookies** (a concurrent winner's `Set-Cookie`
   is attached by then) before any expiry handling. The expire route itself
   performs a **last-chance refresh** before nuking the session, so a loser
   arriving there with the winner's (valid, rotated) cookie renews instead of
   destroying it. Session destruction therefore requires the refresh token to
   be *actually* dead — not merely raced.
3. **Bounded recovery, no storms.** The `isRetryAfterUnauthorized` boolean in
   `fetchData` becomes an **auth-attempt counter capped at 2** (round-2
   follow-up 2): refresh is attempted only on the **first** 401; attempt 1 =
   the post-refresh retry (or, when refresh failed, the jar-retry with
   current browser cookies); attempt 2 = the post-expire retry; a 401 on
   attempt 2 surfaces the error ("Authentication required") — no further
   recovery. Worst case: original → refresh → retry → expire(last-chance →
   register-guest) → retry → stop. Refresh 5xx/timeout is **never retried** —
   fail straight through to the fallback flow.
4. **Eligibility guards every exchange path** (round-2 follow-up 3): not only
   the client-triggered `{url, server}` check — the **proactive** on-load
   refresh and the **expire last-chance** refresh also run
   `isVerifiedMarketUser()` first and skip the exchange for a
   verified/Laravel-routed session (FR-8): a residual Go refresh cookie must
   never overwrite a verified user's `MARKET-TOKEN`/`User-Data` with a
   Go-issued pair.

**Rejected alternatives:** refreshing in `proxy.ts` middleware (most
sensitive protected file, per-request backend call, race amplification);
refreshing during RSC render with a transient token (burns the single-use
token — NFR-2 violation); comparing cookie "generations" in the expire route
(HttpOnly cookies aren't client-readable — the last-chance refresh attempt
answers "is the current cookie newer/valid?" by simply trying it).

**Decisions on spec open questions:**
- **Base URL prefix:** existing Go calls already append `/auth/...` to
  `GO_BACKEND_URL`, so the env value carries the `/api/v1` prefix; the new
  constant stays prefix-free (`/auth/refresh-token`). Confirm against staging
  env at implement time.
- **`name` param on OTP verify:** dropped — contract body is
  `{verificationId, otp}` only. Flagged to backend.
- **Staging readiness:** checked at implement time before wiring; if the Go
  endpoints are not live, `/implement` blocks rather than ships dark code.

## Steps

1. **Revert `c4796b9b`** via `git revert --no-commit c4796b9b` on the ticket
   branch — restores `GO_BACKEND_URL` in the 8 affected files and the
   user-based routing in `tokenManager.ts`. Working-tree edits only; **no
   commit** (IM-9).
2. **Cookie plumbing:** add `MARKET_REFRESH_TOKEN: "MARKET-REFRESH-TOKEN"` to
   `COOKIE_NAMES` + `HTTPONLY_COOKIE_NAMES` (cookie-manager); in
   `tokenManager.ts` add `REFRESH_COOKIE_OPTIONS` (HttpOnly, secure, strict,
   `maxAge` 30 days — re-set on every rotation, AC-14) and add the new name
   to `SECURE_COOKIE_NAMES` so logout/clear-tokens purge it automatically
   (AC-15).
3. **Endpoint constant:** add `REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token"`
   to `utils/fetch/Endpoints.ts`.
4. **Shared helper `utils/server/authRefresh.ts` (new):** adapter registry
   `{ go: { baseUrl, endpoint, buildBody(refreshToken), parseResponse } }`
   (AC-16); `refreshMarketSession()` — reads the refresh cookie (absent →
   fast "no-token" result, no upstream call), module-scope single-flight,
   sends `Lang`/`Country` from the current locale (AC-17), on success
   persists `MARKET-TOKEN` + `MARKET-REFRESH-TOKEN` + `User-Data`
   (AC-4/AC-13); also exposes a **local access-token expiry check** (JWT
   `exp` / `User-Data.expired_at`) for the proactive path. On upstream 401
   returns "invalid" — **it never falls back to register-guest itself**. No
   retry on 5xx/timeout (returns "unavailable"; callers fail through). Never
   logs token values (NFR-3).
5. **Internal route `app/api/auth/refresh/route.ts` (new):** POST; honors
   `LOGOUT_GUARD` (no-op during logout, AC-15); accepts the failed request's
   `{url, server}` (optional — absent for the proactive on-load call, which
   is always eligible); behavior:
   - **eligibility (FR-3/FR-8):** when `{url, server}` is supplied, apply the
     same routing helpers (`isVerifiedMarketUser` + `isFromGoApi`) — a
     request that would have been Laravel-served → `{eligible: false}`, no
     refresh attempted; the client proceeds with today's flow. The
     **proactive** call (no `{url, server}`) is *not* exempt: it still runs
     `isVerifiedMarketUser()` and returns `{eligible: false}` for a
     verified/Laravel-routed session (Approach rule 4);
   - access token still valid (local check) → `{refreshed: false}` fast no-op
     — this makes the proactive on-load call cheap;
   - expired + refresh cookie → exchange via the helper; success →
     `{refreshed: true}` (cookies set on the response; **no token in the
     body**, AC-2);
   - no cookie / invalid / unavailable → `401` — the client falls through to
     its existing expiry flow.
6. **Server 401 path — `HandleAuthedFetch.ts`:** on 401 (guard not armed):
   cookie-writability probe → if writable, request base is `GO_BACKEND_URL`,
   **and a refresh cookie exists** → `refreshMarketSession()` + retry once
   with the new token (AC-3). A refresh-401 **returns the 401 to the caller**
   (client recovery owns races — review follow-up 3). The bodyless
   register-guest fallback (drop `old_guest_user_id` + retry ladder, persist
   `refresh_token` when persistable) runs **only when no refresh cookie
   exists at all** (rollout window). Non-writable context → return the 401
   unchanged (recovery via step 9/10).
7. **Fallback routes → contract conformance + last-chance guard:**
   - `app/api/auth/expire/route.ts` — **refresh-aware**: before any session
     nuke, if a refresh cookie exists **and** `isVerifiedMarketUser()` is
     false (guest/Go-eligible session — Approach rule 4, round-2 follow-up
     3), attempt the exchange via the helper (route handler = persistable).
     Success → set the renewed cookies, return a **`{renewed: true}`**
     response — **no nuke, no chat/stories `need_auth`, no verification
     downgrade** (protects a race loser carrying the winner's valid rotated
     cookie — round-1 follow-up 2). Only on refresh failure/absence/
     ineligibility: proceed as today — delete tokens (now incl. the dead
     refresh cookie), flag re-auth, bodyless `register-guest`, persist the
     new pair (AC-5/AC-6).
   - `services/auth.ts > _doExpire()` — **client half of the renewed outcome
     (round-2 follow-up 1):** read the `/api/auth/expire` response; on
     `{renewed: true}` **skip** `cancelAuth(true)` /
     `setReAuthResult("cancelled")` and re-sync client state instead (set
     `reAuthResult: "success"` for waiting callers and refresh via the
     `CheckLogin()` / `router.refresh()` path), so a race-loser tab adopts
     the winner's session without a store downgrade (AC-10/AC-12). The nuked
     outcome keeps today's cancel behavior.
   - `app/api/auth/register-device/route.ts` — bodyless `register-guest`,
     remove the `old_guest_user_id` ladder, persist `data.refresh_token`.
   - `utils/server/otpIdentity.ts` — same conformance for
     `registerGuestForOtp()`.
   - `services/home.ts` — stop sending `old_guest_user_id` in
     `registerForExpire()` / `RegisterDevice()` bodies.
8. **OTP verify — `app/api/auth/login/route.ts`:** switch to
   `POST /auth/phone/verify_otp_from_guest` with JSON body
   `{verificationId, otp}` + Bearer (drop `name`); token-bearing branch →
   persist the full new pair (AC-7); legacy branch (no `token` in `data`) →
   leave stored tokens untouched (AC-8).
9. **Client 401 path:** `utils/fetchData.ts` — on a market/market-dashboard
   401, call `RefreshSession(failedUrl, server)` (`services/auth.ts`,
   in-flight-deduped like `_expirePromise`, POSTs `/api/auth/refresh` with
   the failed `{url, server}`); the route decides Go-eligibility with the
   shared routing helpers (step 5). `{refreshed: true}` → retry original
   (AC-3). **Refresh failure → retry the original once with current browser
   cookies** (winner's rotation arrives with the jar — review follow-up 1);
   only a second 401 enters today's flow (`ExpiredUser` / seller widget).
   `{eligible: false}` (Laravel-served) → today's flow directly
   (AC-9/AC-10/AC-11). The whole chain runs under the **auth-attempt counter
   (cap 2)** replacing the `isRetryAfterUnauthorized` boolean — Approach
   rule 3 (round-1 follow-up 5, round-2 follow-up 2).
10. **Proactive RSC recovery (review follow-up 4):**
    `services/home.ts > CheckLogin()` calls `RefreshSession()` **first** on
    app load — the route's fast no-op makes this cheap when the token is
    valid; when it returns `{refreshed: true}`, `components/Home/Init.tsx`
    (the `CheckLogin` caller — a client component with router access) calls
    `router.refresh()` to refetch server-rendered content, so an
    expired-session visit self-heals in one cycle (NFR-6, AC-3). A 401 from
    the proactive call falls into the existing `RegisterDevice` bootstrap
    path unchanged.
11. **Validation** per the strategy below, including the repo-wide
    `old_guest_user_id` grep (AC-6) and the staging scenario walkthrough.

## Files to change

> ⚠ = `protected_paths` entry (GU-2/IM-5) — listed here explicitly.

Reverted by step 1 (`git revert --no-commit c4796b9b`):
- ⚠ `app/api/auth/expire/route.ts` — restore `GO_BACKEND_URL` (then step 7 edits)
- ⚠ `app/api/auth/login/route.ts` — restore `GO_BACKEND_URL` (then step 8 edits)
- ⚠ `app/api/auth/register-device/route.ts` — restore `GO_BACKEND_URL` (then step 7 edits)
- `app/api/internal/mobile-error-log/route.ts` — restore `GO_BACKEND_URL` (revert only)
- ⚠ `serverRequests/HandleAuthedFetch.ts` — restore `GO_BACKEND_URL` (then step 6 edits)
- `utils/server/mobileErrorLog.ts` — restore `GO_BACKEND_URL` (revert only)
- `utils/server/otpIdentity.ts` — restore `GO_BACKEND_URL` (then step 7 edits)
- `utils/server/tokenManager.ts` — restore user-based routing (then step 2 edits)

New files:
- `utils/server/authRefresh.ts` — shared backend-aware refresh helper (step 4)
- ⚠ `app/api/auth/refresh/route.ts` — internal refresh route (step 5; under `app/api/auth/**`)

Modified:
- ⚠ `utils/cookies/cookie-manager.ts` — new cookie name + HttpOnly set (step 2)
- `utils/fetch/Endpoints.ts` — `REFRESH_TOKEN_ENDPOINT` (step 3)
- `utils/fetchData.ts` — market 401 → refresh-first + jar-retry; auth-attempt
  counter (cap 2) replaces `isRetryAfterUnauthorized` boolean (step 9)
- ⚠ `services/auth.ts` — `RefreshSession(url, server)` with in-flight dedup
  (steps 9/10); `_doExpire()` renewed-response branch (step 7)
- `services/home.ts` — drop `old_guest_user_id` bodies; proactive
  `RefreshSession()` in `CheckLogin()` (steps 7/10)
- `components/Home/Init.tsx` — `router.refresh()` after a proactive
  `{refreshed: true}` (step 10)

## Validation strategy

- Validation profile: `full-build`   (typecheck + lint + production build —
  protected-path, build-affecting change)
- Code-level checks: repo-wide grep shows zero remaining `old_guest_user_id`
  senders (AC-6); no client-readable surface carries the refresh token —
  refresh route responses, sanitizers, and logs inspected (AC-2 / NFR-3);
  `SECURE_COOKIE_NAMES` includes the refresh cookie (AC-15); adapter registry
  contains only `go` (AC-16); no server path calls register-guest while a
  refresh cookie exists (review follow-up 3); refresh 5xx path has no retry
  (review follow-up 5).
- Manual staging walkthrough mapped to ACs (no automated suite by policy):
  fresh guest gets both cookies (AC-2); expire access token → Go-routed
  request renews seamlessly, same user id/cart (AC-3/AC-4); expired-session
  page load self-heals via proactive refresh + `router.refresh()` (AC-3,
  follow-up 4); replay old refresh token → 401 (AC-4); delete refresh cookie
  → clean bodyless register-guest fallback (AC-5); verified-user Laravel 401
  → today's flow, no refresh call (AC-1/AC-9); OTP verify promote + merge
  branches (AC-7), legacy branch tolerance (AC-8); chat/stories/comments/
  wallet 401s unchanged (AC-10/AC-11); **multi-tab expiry race → both tabs
  end on the winner's session, expire route renews instead of nuking**
  (AC-12/AC-13, follow-ups 1/2); cookie max-age renewed after rotation
  (AC-14); logout purges refresh cookie and blocks refresh mid-logout
  (AC-15); locale headers sent on refresh (AC-17); expire `{renewed: true}` →
  client keeps store state (no cancel/downgrade) and re-syncs (round-2
  follow-up 1); verified user with residual Go refresh cookie → proactive and
  expire paths skip the exchange (round-2 follow-up 3).
- Ops check (non-code, review follow-up 7): confirm Vercel Firewall rules
  covering `app/api/auth/*` include the new `/api/auth/refresh` path.

## Rollback

- Staging environment (per intake, no formal rollback rehearsal required).
- Pre-publish: discard the working-tree changes on the ticket branch
  (`git restore`).
- Post-publish: revert the single publishable commit. **Documented caveat
  (review follow-up 6):** browsers keep a live ~30-day `MARKET-REFRESH-TOKEN`
  cookie that reverted logout code would no longer purge; any revert patch
  should retain the `SECURE_COOKIE_NAMES` entry for the refresh cookie
  (DEVICE_TOKEN precedent — kept for cleanup only) so logout keeps purging
  it. Tokens themselves expire server-side in ≤30 days.
- Emergency lever: re-applying the `c4796b9b` force-to-Laravel patch takes Go
  out of the serving path entirely.

## Out of scope

- Laravel refresh integration (future adapter entry; endpoint/shape TBD).
- Refresh adoption for chat, stories, comments, wallet (FR-9 — untouched).
- Mobile app changes (same contract, separate codebase).
- Stale-comment cleanup in `utils/phone.ts` /
  `components/setting/profile/VerifyUser.tsx` (comments only, no behavior).
- Backend work: cleanup job, instant revocation, theft detection, the `name`
  param question's backend side.
- `next.config.ts`, `proxy.ts` (middleware), store slices — no changes.

## Revision — follow-ups addressed (review.md 2026-07-23)

| # | Required follow-up | Addressed by |
|---|--------------------|--------------|
| 1 | Client retries original with current browser cookies before expire flow | Step 9 (jar-retry after refresh failure); Approach rule 2 |
| 2 | Expire must not wipe a newer/valid refresh cookie | Step 7: expire performs a last-chance refresh and only nukes when it fails — "newer?" is answered by trying the current cookie, not comparing HttpOnly values |
| 3 | Server-side refresh-401 → return 401, not register-guest | Steps 4/6: helper never falls back; `HandleAuthedFetch` register-guests only when **no** refresh cookie exists |
| 4 | Wire the RSC recovery trigger | Step 10: proactive `RefreshSession()` in `CheckLogin()` + `router.refresh()` in `components/Home/Init.tsx`; fast no-op path in step 5 |
| 5 | Retry ceiling; no refresh 5xx retry | Approach rule 3; steps 4/9; validation code-check |
| 6 | Rollback refresh-cookie caveat | Rollback section (retain purge-list entry; DEVICE_TOKEN precedent) |
| 7 | Vercel Firewall coverage of `/api/auth/refresh` | Validation strategy — ops check (dashboard, non-code) |

Round 2 (review.md 2026-07-23, round 2):

| # | Required follow-up | Addressed by |
|---|--------------------|--------------|
| 1 | Client half of expire renewal (`_doExpire` must honor `{renewed: true}`) | Step 7 (`services/auth.ts > _doExpire()` branch: skip cancel, `reAuthResult: "success"`, re-sync via `CheckLogin()`/`router.refresh()`) |
| 2 | Concrete retry-ceiling mechanics | Approach rule 3 + steps 9: auth-attempt counter capped at 2 replaces the `isRetryAfterUnauthorized` boolean (attempt 1 = post-refresh/jar retry; attempt 2 = post-expire retry; refresh only on first 401) |
| 3 | Eligibility on all exchange paths | Approach rule 4; step 5 (proactive call runs `isVerifiedMarketUser()`), step 7 (expire last-chance gated on `isVerifiedMarketUser()` false) |
| 4 | *(ops, carried)* Firewall coverage of `/api/auth/refresh` | Validation strategy — ops check (unchanged) |
