---
ticket: user-based-go-laravel-routing
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: ai_agent
updated: 2026-07-22
links:
  clickup:
  github:
---

# Research — user-based-go-laravel-routing

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the Go-vs-Laravel backend choice for "market" API calls depend on the
caller's verification state (valid phone in `User-Data`) as well as the URL:
verified → always Laravel; guest/tokenless → Go for allow-listed endpoints,
Laravel otherwise.

## Relevant directories

- `utils/server/` — `tokenManager.ts` holds the central switch:
  `GO_APIS` / `GO_API_PREFIXES` (`:64-108`), `isFromGoApi()` (`:113`),
  `getServerBaseUrl()` (`:118-139`, the `market`/`market-dashboard` case is the
  one that branches Go/Laravel), `getSecureCookie()` (reads `User-Data`),
  `getCurrentUser()`. **Note: `getServerBaseUrl` is synchronous today; the
  verified signal lives in an async cookie read** — the design must either make
  it async or pass a precomputed verified flag (a `/plan` decision).
- `app/api/proxy/` — `route.ts:80` calls `getServerBaseUrl(server, targetUrl)`;
  this is the funnel for **all client-side** market traffic (`fetchData` →
  `/api/proxy`). One decision point covers every client call.
- `serverRequests/` — server-component fetch paths that **hardcode
  `GO_BACKEND_URL`** for allow-listed market endpoints (each must become
  user-aware, R5):
  - `products.ts:137,146,170` — `/web/product/globalDetails`,
    `/web/product/qtyPriceDetails`, `/web/product/likesDetails`
  - `product.tsx:180,243,289` — `/web/product/globalDetails`,
    `/web/product/qtyPriceDetails`, `/web/product/product-meta`
  - `index.tsx:9` — `/web/home/startingSettings`
  - `currency.ts:58` — `/home/currency`
  - `analyticsUtility.ts:13` — `/web/get-colors-and-sizes`
- `serverRequests/` + `app/api/auth/` + `utils/server/` — Go **bootstrap** calls
  that stay on Go per R7 (guest-only by nature, NOT rerouted):
  `HandleAuthedFetch.ts:71`, `app/api/auth/register-device/route.ts:37,58`,
  `app/api/auth/expire/route.ts:79,98`, `utils/server/otpIdentity.ts:153`
  (all `/auth/register-guest`), `app/api/auth/login/route.ts:92` (OTP verify —
  caller is still a guest at that moment).
- `app/api/auth/` — where `User-Data` (the verified-phone signal) is written:
  `login/route.ts:276` (real profile incl. phone, `is_phone_verified: 1`),
  `register-device/route.ts:96`, `expire/route.ts:64,133`,
  `clear-tokens/route.ts:59` (guest/degraded profiles),
  plus `serverRequests/HandleAuthedFetch.ts:99` and
  `utils/server/otpIdentity.ts:190` (guest re-register). Per-request cookie
  reads therefore see the flip immediately after login/expiry (R4).

## Relevant config files

- `.claude/project-config.yaml > protected_paths` — **`serverRequests/**`,
  `utils/cookies/**`, and `app/api/auth/**` are protected**; every file from
  those trees touched by this ticket must be listed explicitly in `plan.md`
  "Files to change" (GU-2 / IM-5). `utils/server/tokenManager.ts` and
  `app/api/proxy/` are *not* protected paths.
- Env vars — `GO_BACKEND_URL` (Go store gateway) and `BACKEND_URL` (Laravel
  market) are the only two bases involved; both already exist. No code uses
  `NEXT_PUBLIC_GO_BACKEND_URL` (docs mentioning it are stale).
- `utils/endpointConfig.tsx` — endpoint path constants (unchanged; listed for
  orientation).

## Possibly affected services

- **Client market services** (`services/cart.ts`, `services/home.ts`,
  `services/auth.ts`, etc. via `fetchData` → `/api/proxy`) — routing for their
  allow-listed calls flips to Laravel for verified users; no caller change
  expected (identical response shapes confirmed at intake).
- **Server components / actions** using the `serverRequests/*` fetchers above —
  product page (globalDetails/qtyPriceDetails/product-meta/likesDetails), home
  startingSettings, currency, colors-and-sizes.
- **Go store gateway** — traffic from verified users drops to zero.
- **Laravel market backend** — absorbs all verified-user traffic including
  cart/checklist/FCM-settings endpoints currently served by Go.
- NOT affected (R6): `market-dashboard`, chat, stories, elastic, comments,
  wallet routing; `/api/proxy` security checks (origin/path validation, OTP
  block) are orthogonal and untouched.

## Test / validation commands available

(List only — none were run during research.)

- `pnpm exec tsc --noEmit` — type safety (`validation_checks.typecheck`).
- `pnpm lint` — ESLint incl. i18n key enforcement (`validation_checks.lint`).
- `pnpm build` — production build (`validation_checks.build`).
- `pnpm knip` — unused files/exports (`validation_checks.knip`).
- Validation profiles: `standard-frontend` (typecheck+lint) and **`full-build`**
  (typecheck+lint+build — intended for `protected_paths` / high-blast-radius
  work; this ticket touches `serverRequests/**`, so `full-build` is the fit).
- Manual routing evidence: dev-server request logs (`logSecureRequest` prints
  `[Proxy]` entries in non-production) can show which base URL served a call.

## Risks and unknowns

- **Sync→async boundary:** `getServerBaseUrl` is sync and exported; the
  verified check needs `cookies()` (async). Changing its signature ripples to
  `app/api/proxy/route.ts`; the hardcoded `serverRequests/*` sites need the
  same decision applied by hand. Risk of missing a call site — mitigated by the
  inventory above (grep `GO_BACKEND_URL` is the completeness check).
- **Static/cached rendering:** the hardcoded server fetch paths (currency,
  startingSettings, product fetchers) may run in contexts where `cookies()`
  forces dynamic rendering or is unavailable (build-time/ISR). A cookie read
  added there must fail open to today's behavior (treat as guest → Go) rather
  than throw. Next.js data-cache keys include the full URL, so Go- and
  Laravel-served copies of the same endpoint cache separately (no cross-user
  bleed), but cache-hit traffic won't re-route until revalidation.
- **Guest `User-Data.phone` value classes:** intake fixed the invalid set
  (missing/null/undefined/`""`/`0`/`"0"`), matching guest profiles seen in the
  auth flows; if the Go register-guest response ever carries a different
  placeholder (e.g. `"null"`), a guest would be misrouted to Laravel. The
  predicate should be conservative and centralized (R3).
- **Laravel parity assumption:** identical response shapes confirmed at intake
  (owner). If any allow-listed endpoint (e.g. `/customer/*`, migrated to Go in
  ticket `migrate-customer-api-to-go`) has drifted on Laravel, verified users
  regress — verification must exercise a sample of allow-listed endpoints
  against Laravel.
- **`register-device/route.ts` imports `isFromGoApi` without using it** —
  incidental; do not "clean up" outside plan scope (IM-4).

## Open questions

- Mobile error log (`utils/server/mobileErrorLog.ts:18`,
  `app/api/internal/mobile-error-log/route.ts:45` → Go
  `/mobile_error_log/store`): infra logging, not a user-profile API — assume it
  stays on Go (out of routing scope)? To be settled in `/spec` scope.
- `/checklist` prefix and FCM `/firebase_device_tokens/*` are allow-listed and
  called by logged-in (verified) users today via Go — confirm Laravel serves
  all of them (owner asserted parity; verify covers a sample).
- For the hardcoded server fetchers, should the guest/tokenless fallback when
  `cookies()` is unavailable be documented as expected behavior in `spec.md`
  (recommended), so ISR/build-time renders deterministically use Go?

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
