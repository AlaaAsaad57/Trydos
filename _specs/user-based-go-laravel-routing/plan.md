---
ticket: user-based-go-laravel-routing
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Plan — user-based-go-laravel-routing

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Centralize the user dimension in `utils/server/tokenManager.ts`: one exported
predicate `hasValidPhone(userData)` (AC-5's exact invalid set) plus one async
resolver `isVerifiedMarketUser()` that reads the `User-Data` cookie inside a
try/catch and returns `false` on any missing/unreadable/no-cookie-context case
(fail-open to guest, AC-8). `getServerBaseUrl` becomes **async** and its
`"market"` case checks the resolver first — verified → `BACKEND_URL`
unconditionally; otherwise today's URL-only logic (`isFromGoApi` → Go, else
Laravel). `"market-dashboard"` is split out and keeps today's URL-only logic
verbatim (AC-10). For the eight server-side fetchers that hardcode
`GO_BACKEND_URL`, a second helper `getMarketFetchBase()` returns `BACKEND_URL`
when verified, else `GO_BACKEND_URL` — deliberately **without** consulting the
allow-list, because `/web/product/likesDetails/<slug>` is hardcoded-to-Go today
while NOT allow-listed; running it through `isFromGoApi` would flip guests to
Laravel and violate "guest behavior unchanged" (AC-3). Alternative rejected:
threading a `verified` flag parameter through every caller — more churn, same
result, and it scatters the cookie read instead of keeping one source of truth.

## Steps

1. In `utils/server/tokenManager.ts`: add `hasValidPhone()` +
   `isVerifiedMarketUser()` + `getMarketFetchBase()`; make `getServerBaseUrl`
   async; give `"market"` the verified-first branch and `"market-dashboard"`
   its own unchanged URL-only branch; export the new functions.
2. In `app/api/proxy/route.ts`: `await getServerBaseUrl(server, targetUrl)`
   (line 80) — the only call-site of that function.
3. Switch the eight hardcoded `process.env.GO_BACKEND_URL` market fetches to
   `` `${await getMarketFetchBase()}<path>` ``:
   `serverRequests/products.ts` (globalDetails, qtyPriceDetails, likesDetails),
   `serverRequests/product.tsx` (globalDetails, qtyPriceDetails, product-meta),
   `serverRequests/index.tsx` (startingSettings),
   `serverRequests/currency.ts` (currency),
   `serverRequests/analyticsUtility.ts` (get-colors-and-sizes).
   Bootstrap calls (`HandleAuthedFetch`, register-device, expire, otpIdentity,
   login OTP verify) are NOT touched (AC-9).
4. Run the validation profile checks and capture routing evidence for the AC
   matrix (dev-server `[Proxy]` logs / code inspection per AC-1..AC-8).

## Files to change

- `utils/server/tokenManager.ts` — add `hasValidPhone`, `isVerifiedMarketUser`,
  `getMarketFetchBase`; async `getServerBaseUrl` with user-aware `"market"`
  case; `"market-dashboard"` split out unchanged. (Not a protected path.)
- `app/api/proxy/route.ts` — await the now-async `getServerBaseUrl`. (Not a
  protected path.)
- `serverRequests/products.ts` — **protected path** — 3 base-URL swaps to
  `getMarketFetchBase()`.
- `serverRequests/product.tsx` — **protected path** — 3 base-URL swaps.
- `serverRequests/index.tsx` — **protected path** — 1 base-URL swap.
- `serverRequests/currency.ts` — **protected path** — 1 base-URL swap.
- `serverRequests/analyticsUtility.ts` — **protected path** — 1 base-URL swap.

No other file is modified. The unused `isFromGoApi` import in
`app/api/auth/register-device/route.ts` is left alone (out of plan scope).

## Validation strategy

- Validation profile: full-build
- AC evidence beyond the profile: map each `AC-1..AC-11` to code inspection of
  the routing branches plus dev-server `[Proxy]` log lines showing the resolved
  base per caller class (verified / guest / tokenless); confirm `git diff`
  touches only the seven listed files (AC-10 scope check).

## Rollback

- No commit is created before `/publish-pr`, so rollback during/after
  implementation is `git checkout -- <the seven files>` on the ticket branch
  (or deleting the branch). After publishing, revert the single publishable
  commit — the change is one cohesive diff with no data migration, so revert
  fully restores URL-only routing.

## Out of scope

- Adding/removing `GO_APIS` / `GO_API_PREFIXES` entries (incl. NOT
  allow-listing `likesDetails`).
- Any Go or Laravel backend change; response-shape adapters.
- Routing for non-market servers; `market-dashboard` behavior change.
- Re-introducing the legacy `DEVICE-TOKEN` cookie.
- Touching guest-bootstrap call sites or the error-log telemetry path.
- Cleaning up unrelated imports/code in touched or neighboring files.
