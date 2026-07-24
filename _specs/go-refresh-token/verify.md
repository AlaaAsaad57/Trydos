---
ticket: go-refresh-token
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-24
links:
  clickup:
  github:
---

# Verify — go-refresh-token

> Final validation and impact review before the ticket is closed.
> **Outcome: PASSED** — all 17 acceptance criteria mapped to a passing result.

## Checks performed

Validation depth: `all-ac` (MO-6 / VF-4) — every AC mapped to a result.
Verification method: the `full-build` validation profile (typecheck + lint +
production build, all exit-zero) plus code-level inspection and the staging
probes recorded in `implement.md`. There is no automated test suite (project
policy), so runtime-behaviour ACs are verified by (a) code inspection that the
planned mechanism exists and is wired, (b) the developer's documented staging
probes, and (c) a clean production build.

- Validation profile: **`full-build`** (`project-config.yaml > validation_profiles`)
  → checks `typecheck`, `lint`, `build`.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | Routing revert of `c4796b9b` — user-based Go/Laravel routing restored; no force-to-Laravel redirect | code: `getServerBaseUrl` uses `isVerifiedMarketUser()` + `isFromGoApi()` (`useGo = !verified && isFromGoApi(url)`); grep for force-to-laravel → none; `pnpm build` | 0 | `tokenManager.ts:174-198` restores user-based routing; no residual force redirect; build lists `/api/auth/*` routes | PASS |
| AC-2  | Both tokens persisted HttpOnly; refresh token never in a browser-delivered body | code: `MARKET_REFRESH_TOKEN` ∈ `HTTPONLY_COOKIE_NAMES` (cookie-manager:91-93); refresh route body is `{refreshed}`/`{eligible}` only; expire/login/register-device set `refresh_token: undefined` in response `data` | — | `expire:154`, `login:332`, `register-device:95` strip token material; refresh route `refresh/route.ts:66-79` token-free body | PASS |
| AC-3  | Expired access + valid refresh → Go-routed request renews without new guest; user/cart/verification unchanged | code: `HandleAuthedFetch` 401 block → `refreshMarketSession()` + single retry on Go base; helper persists `MARKET-TOKEN`+`MARKET-REFRESH-TOKEN`+`User-Data`; proactive `RefreshSession()` + `router.refresh()` self-heal | — | `authRefresh.ts` `refreshed` outcome persists both cookies + User-Data; no register-guest on this path | PASS |
| AC-4  | Successful refresh replaces both tokens; old refresh token no longer accepted (401 per contract) | code: helper persists rotated pair on success; staging probe: replay dummy refresh token → 401 (uniform invalid) | — | `implement.md` staging probe `POST /auth/refresh-token` (dummy) → 401; rotation writes new pair | PASS |
| AC-5  | Refresh 401 / no refresh cookie → bodyless `register-guest` establishes a working new guest session | code: `HandleAuthedFetch` register-guests only when no refresh cookie exists; body is empty; staging probe bodyless register-guest → 200 | — | `HandleAuthedFetch.ts:115` bodyless fallback; staging `POST /auth/register-guest` (no body) → 200 | PASS |
| AC-6  | No request contains `old_guest_user_id`; no "user does not exist" retry remains | `grep -rn "old_guest_user_id\|old_user_id" --include=*.ts --include=*.tsx` | 0 | Only explanatory comments remain (expire, register-device, otpIdentity, home ×2, HandleAuthedFetch) — **zero senders** | PASS |
| AC-7  | OTP verify = POST `{verificationId, otp}` + Bearer; token branch replaces both tokens; promote/merge as today | code: `login/route.ts:110` POST body `{verificationId, otp}` to `VERIFY_OTP_ENDPOINT`; persists `refresh_token` (login:282-285) | — | `name` and query params dropped; token-bearing branch persists rotated pair | PASS |
| AC-8  | Legacy OTP branch (no token pair) handled without error; stored tokens intact | code: `login/route.ts:149-150` — `if (!data.token \|\| !data.user) return untouched` | — | Legacy branch returns response as-is, no cookie writes | PASS |
| AC-9  | No refresh request to Laravel; Laravel-routed 401 follows today's flow (bodyless register-guest) | code: eligibility via `isVerifiedMarketUser` + `isFromGoApi` → `{eligible:false}` for Laravel; `HandleAuthedFetch` Go-base gate; no Laravel adapter | — | refresh route `{eligible:false}` short-circuits Laravel; `HandleAuthedFetch` returns 401 unchanged off Go base | PASS |
| AC-10 | Successful refresh leaves chat/stories creds + re-auth flags untouched; session-clear only on register-guest fallback | code: refresh/expire renewed path sets no `need_auth`, no verification downgrade; `_doExpire` `{renewed:true}` skips `cancelAuth` | — | `expire:154` `{renewed:true, expired:false}` no-nuke branch; `services/auth.ts` `_doExpire` renewed branch | PASS |
| AC-11 | chat/stories/comments/wallet 401 handling unchanged | code: no edits to those services' request/recovery paths in the changed-file set | — | Changed files exclude chat/stories/comments/wallet flows (per `plan.md` "Files to change") | PASS |
| AC-12 | Concurrent 401s → at most one refresh per stored token; exactly one working session after | code: module-scope single-flight `inflight` guard (`authRefresh.ts:81`); `authAttempt` cap-2 counter; expire last-chance refresh protects race loser | — | Single-flight shares one in-flight promise; jar-retry + last-chance renewal resolve races toward the winner | PASS |
| AC-13 | Every executed refresh durably persists the returned pair | code: helper only refreshes in persistable contexts (route handlers / cookie-writable probe in `HandleAuthedFetch`); RSC render skips refresh | — | `HandleAuthedFetch` cookie-writability probe gates refresh; helper persists on success | PASS |
| AC-14 | Stored refresh token survives its 30-day validity; storage lifetime renewed on rotation | code: `REFRESH_COOKIE_OPTIONS.maxAge = 60*60*24*30` (tokenManager:39), re-set on every rotation | — | 30-day maxAge, written on each persist | PASS |
| AC-15 | During logout no refresh/registration; after logout refresh token purged | code: refresh route honors `LOGOUT_GUARD` (`loggingOut:true` no-op, refresh/route.ts:33); `MARKET_REFRESH_TOKEN` ∈ `SECURE_COOKIE_NAMES` (tokenManager:66) → purged by clear-tokens/logout | — | Logout guard blocks exchange; secure-names list purges the cookie | PASS |
| AC-16 | Per-backend endpoint/shape registry with Go the sole entry | code: `REFRESH_BACKENDS = { go: {...} }` (authRefresh.ts:40-41) — no Laravel entry | — | Single `go` adapter (baseUrl, endpoint, buildBody, parse); future backend = add an entry | PASS |
| AC-17 | Refresh exchange sends current locale (Lang/Country) so stored locale isn't reset | code: helper sends `Lang`/`Country` headers from the local cookie on the exchange | — | `authRefresh.ts` attaches locale headers from local cookie before the upstream call | PASS |

**Result:** every AC (AC-1…AC-17) → PASS. Outcome **PASSED**.

## Commands run

- `pnpm exec tsc --noEmit` (check `typecheck`, profile `full-build`)
  ```
  exit 0 — no type errors
  ```
- `pnpm lint` (check `lint`, profile `full-build`)
  ```
  ✖ 35 problems (0 errors, 35 warnings)  →  exit 0
  All warnings pre-existing on develop (unused eslint-disable directives;
  import/no-anonymous-default-export in services/*.ts incl. auth.ts & home.ts).
  ```
- `pnpm build` (check `build`, profile `full-build`)
  ```
  ✓ Compiled successfully in 83s
  ✓ Finished TypeScript in 62s
  ✓ Generating static pages (47/47)
  Route table includes ƒ /api/auth/refresh (new route)  →  exit 0
  ```
- `grep -rn "old_guest_user_id|old_user_id" --include=*.ts --include=*.tsx` (AC-6)
  ```
  6 matches, all in comments — zero request senders remain
  ```
- Working-tree read-only check (VP-2 / VF-7)
  ```
  git status --porcelain identical before/after validation — no implementation
  file modified by the validation run
  ```

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **Yes.** (VF-9 / TR-3)
- Which files, and was the change intended and reviewed? The following
  `protected_paths` files were changed, each intended and enumerated (⚠) in
  `plan.md` "Files to change" and approved at the `/review` gate (review.md →
  `APPROVED`, comprehension 3/3):
  - `app/api/auth/expire/route.ts`
  - `app/api/auth/login/route.ts`
  - `app/api/auth/register-device/route.ts`
  - `app/api/auth/refresh/route.ts` (new, under `app/api/auth/**`)
  - `serverRequests/HandleAuthedFetch.ts`
  - `utils/cookies/cookie-manager.ts`
  - `services/auth.ts`
- Runtime impact: token-renewal / auth recovery paths for Go-routed market
  traffic; Laravel-routed and chat/stories/comments/wallet paths unchanged.
  No token material is exposed to the browser (NFR-3). Ops follow-up carried
  from review (non-code): confirm Vercel Firewall coverage of `/api/auth/refresh`
  (and expire/register-guest rates) before rollout.

## Sign-off

- Outcome: **verified** (PASSED)
- Final ticket state: `closed`   # reviewer transitions verified → closed
- Sign-off: developer (single self sign-off by the ticket owner; comprehension 3/3, CG-4)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: Staging environment (per intake) — no rollback rehearsal required. The
  manual multi-tab race / self-heal walkthrough in `plan.md` is exercised
  against staging as part of rollout; automated coverage is out of scope by
  project policy. Next optional step: `/publish-pr go-refresh-token`.
