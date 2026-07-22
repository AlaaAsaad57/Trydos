# Shop currency overlay on product price inputs — Design

**Date:** 2026-07-22
**Status:** Approved by user (approach B)

## Problem

`GET /shop/info` (market-dashboard) returns the shop's currency, e.g.
`currency: { code: "SYP", name: "Syrian Pound" }`. Today it is fetched only in
the branding tab (`components/SellerDashboard/ShopInfo.tsx`). The product
add/edit pages never see it, so sellers type prices with no indication of which
currency they are entering. Additionally, the Tax / Tax Type inputs are to be
removed from the product form for now.

## Decision (approach B — dashboard-level fetch + store)

Fetch `/shop/info` once per shop for the whole seller dashboard, keep the
currency in the global Zustand store, and overlay the currency **code** on every
money input in the product add/edit form.

Rejected alternatives:
- **A. Fetch inside `ProductEditor` only** — works, but repeats the request per
  page and keeps the data private to one screen.
- **C. Backend adds currency to the lookups endpoints** — blocked on backend.

## Design

### 1. Store (`store/index.ts`)

Follow the existing inline pattern (`sellerOrders`, `cameraPermissions`) — no
new slice file:

- `dashboardShopInfo: { sellerId: string; currency: { code: string; name: string } } | null`
  (initial `null`)
- `setDashboardShopInfo(info)` setter.

Keyed by `sellerId` so switching shops never shows a stale currency.

### 2. Loader (`components/SellerDashboard/ShopInfoLoader.tsx`, new)

`"use client"` component that renders `null`. Mounted from the server layout
`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/layout.tsx` next
to `{children}`, so it runs on **every** dashboard route (home, products/new,
products/[productId], boutiques).

On mount: if `dashboardShopInfo?.sellerId !== sellerId`, call
`SellerDashboardService.getShopInfo(sellerId)` and dispatch
`{ sellerId, currency }` from `res.data.currency`. Failures are logged via
`LogError` and otherwise silent — the UI simply shows no overlay.

### 3. Consumption (`ProductEditor.tsx` → sections)

`ProductEditor` reads `useAppStore((s) => s.dashboardShopInfo)` and derives
`currency` = `code` only when the stored `sellerId` matches its own `sellerId`
prop; otherwise empty. The value is passed down via `SectionProps`.

### 4. Overlay UI (`productEdit/sections.tsx`)

`Num` gets an optional `suffix?: string` prop:

- Input wrapped in a `relative` container; suffix rendered as an absolutely
  positioned span at the inline **end** (`end-*`, RTL-safe), muted color,
  `pointer-events-none`; input receives end padding so text never runs under it.
- Currency codes are shown as-is (`SYP`) — not translated.

Suffix applied to these money inputs:
- Pricing & Stock: **Unit Price, Discount Price, Purchase Price, Luck Price,
  Shipping Cost**
- **Per-country Extra Price** row inputs
- Variant table: **Price**, **Discount**, and **Luck** cells (compact overlay in
  the narrow cells)

Not applied to non-money numbers (stock, weight, qty, pieces, shipping days,
variant Qty/SKU/Barcode).

### 5. Tax removal

- Delete the **Tax** `Num` and **Tax Type** `Select` from `PricingSection`.
- `helpers.ts > buildUpdateFormData`: always `set("tax", "0")` and
  `set("tax_type", "flat")` (comment updated to say the fields are forced while
  the inputs are hidden).
- Remove `tax` / `tax_type` from the confirm-diff label list and from any
  `validate()` rules so the forced values never appear as phantom changes.
- `ProductForm` keeps the `tax` / `tax_type` fields (loaded from the product) so
  types and hydration stay untouched — they are simply no longer editable or
  user-sent.

### 6. Out of scope

- Product cards keep their hardcoded "USD" (explicitly deferred).
- `ShopInfo.tsx` branding tab keeps its own fetch.
- No backend/API changes; no tests (repo policy).

## Error handling

No currency in store (fetch failed, still loading, seller mismatch) → inputs
render exactly as today, no overlay. Nothing else depends on the fetch.

## i18n

No new user-visible strings: the overlay is the raw ISO currency code, and the
tax change only removes strings.
