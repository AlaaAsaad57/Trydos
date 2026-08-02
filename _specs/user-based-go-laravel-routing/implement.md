---
ticket: user-based-go-laravel-routing
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Implement — user-based-go-laravel-routing

> Record of what was actually built, following `plan.md`.

## Changes made

- `utils/server/tokenManager.ts` — added `hasValidPhone()` (single-source
  predicate; invalid = missing/null/undefined/`""`/whitespace/`0`/`"0"`),
  `isVerifiedMarketUser()` (whole body incl. the cookie read inside try/catch —
  fails open to guest, review follow-up honored), and `getMarketFetchBase()`
  (verified → `BACKEND_URL`, else `GO_BACKEND_URL`; deliberately allow-list
  free). `getServerBaseUrl` is now **async**: `"market"` checks
  `isVerifiedMarketUser()` first (verified → Laravel unconditionally), then
  falls through to the unchanged URL-only logic; `"market-dashboard"` was split
  into its own case with the URL-only logic verbatim.
- `app/api/proxy/route.ts` — `await getServerBaseUrl(...)` (line 80; grep
  re-confirmed at implement time this is the **only** caller, review
  follow-up honored). SSRF/path validation continues to run on the same
  resolved string used for fetch.
- `serverRequests/products.ts` — **protected path** — 3 swaps to
  `getMarketFetchBase()` (globalDetails, qtyPriceDetails, likesDetails); base
  resolved once per request before the `Promise.all`.
- `serverRequests/product.tsx` — **protected path** — 3 swaps (globalDetails,
  qtyPriceDetails, product-meta), one per function.
- `serverRequests/index.tsx` — **protected path** — 1 swap
  (startingSettings).
- `serverRequests/currency.ts` — **protected path** — 1 swap (currency).
- `serverRequests/analyticsUtility.ts` — **protected path** — 1 swap
  (get-colors-and-sizes).

Notes required by the review follow-ups:
- The rerouted server fetch paths send **no Authorization header** (host
  change only — anonymous traffic on both backends) and must stay
  `revalidate: 0` (or be cache-keyed deliberately) while user-dependent.
- `serverRequests/products.ts` line ~171: the panel-flagged leftover is an
  inert `//`-commented Laravel URL (not malformed) — left untouched.
- Guest bootstrap calls (`HandleAuthedFetch` register-guest, register-device,
  expire, otpIdentity, login OTP verify) untouched — the remaining
  `GO_BACKEND_URL` reference in `serverRequests/` is exactly the bootstrap
  call (grep-verified).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `utils/server/tokenManager.ts`
- `app/api/proxy/route.ts`
- `serverRequests/products.ts` (protected)
- `serverRequests/product.tsx` (protected)
- `serverRequests/index.tsx` (protected)
- `serverRequests/currency.ts` (protected)
- `serverRequests/analyticsUtility.ts` (protected)

All left as uncommitted working-tree edits on branch
`ticket/user-based-go-laravel-routing` (created from `develop`).

## Resume (after /verify FAILED on AC-11 build)

`/verify` failed the `pnpm build` check: a top-level `tokenManager` import in
`serverRequests/index.tsx` pulled `next/headers` into the Client Component
graph (`AddToCartComponent` → `CartProvider` → layout). Root-cause analysis on
resume: `products.ts` / `product.tsx` / `currency.ts` are `"use server"`
modules — client imports of them become action proxies, so a static
`tokenManager` import is safe there (they already import `next/headers`
themselves). `index.tsx` and `analyticsUtility.ts` are plain modules — even a
*dynamic* import is traced by Turbopack into the client graph.

Fix applied (same seven files, no scope change):
- `products.ts` — static `getMarketFetchBase` import restored **and** a new
  exported `resolveMarketFetchBase()` server-action wrapper added, so
  non-`"use server"` siblings can reach the routing through an action proxy.
- `product.tsx`, `currency.ts` — static `getMarketFetchBase` imports (safe,
  `"use server"`).
- `index.tsx`, `analyticsUtility.ts` — use `resolveMarketFetchBase` from
  `./products`; they never reference `tokenManager` directly.

## Deviations from plan

- `develop` carried two pre-existing uncommitted `.claude/` workflow-tooling
  edits (`hooks/notify_gate.py`, `settings.json` — gate-hook matcher tweak) at
  branch creation. Owner explicitly chose to proceed (IM-8 dirt accepted);
  they ride along uncommitted and are excluded from the publishable commit
  (PB-9 staging confinement).
- Import mechanics differ from the plan's literal wording (which assumed a
  plain import at every site): `serverRequests/products.ts` gained an exported
  `resolveMarketFetchBase()` server-action wrapper consumed by `index.tsx` and
  `analyticsUtility.ts` — required to keep `next/headers` out of the client
  bundle graph (the AC-11 build failure documented in `verify.md`). Same seven
  files, same routing behavior, nine swaps as enumerated.

## Validation run during implementation

- `pnpm exec tsc --noEmit` — **PASS** (exit 0; re-run PASS after the resume fix).
- `pnpm lint` — exit 1 with **8 errors, all pre-existing** i18n-key errors in
  `components/SellerDashboard/productEdit/helpers.ts` and
  `services/sellerDashboard/index.ts` (files untouched by this ticket; same
  failures exist on `develop`). **Zero lint problems in the seven changed
  files** (`pnpm exec eslint <7 files>` exit 0, re-run after the resume fix).
  Not fixed here — out of plan scope (IM-4).
- `pnpm build` — **PASS after the resume fix** (exit 0); build route summary
  shows app routes dynamic (`ƒ`) exactly as before — no render-mode change.
- `git diff --name-only` — exactly the 7 planned files (+ the accepted
  `.claude/` dirt) — scope check PASS.
- Grep checks — `getServerBaseUrl` sole caller = `/api/proxy` PASS; no
  non-bootstrap `GO_BACKEND_URL` left in `serverRequests/` PASS.
