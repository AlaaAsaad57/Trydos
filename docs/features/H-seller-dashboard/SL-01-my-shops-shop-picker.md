# SL-01 — My Shops / Shop Picker

| | |
|---|---|
| **Feature ID** | SL-01 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/page.tsx`, `app/(client)/[lang]/sellerProfile/layout.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **entry point into the seller back-office** — a logged-in seller's "Your Shops" page. It
lists every shop the user is allowed to manage, shows their role on each, and lets them open the
full dashboard for a chosen shop (or leave a shop).

## Where it appears

- Route: `/{lang}/sellerProfile` — the **"Your Shops"** picker.
- Each shop links into `/{lang}/sellerProfile/sellerDashboard/<sellerId>` — the full seller
  dashboard (the rest of Domain H, SL-03…SL-14).

## Who uses it

**Sellers / shop staff** — users who have been granted a role on at least one shop. Ordinary
shoppers never see a populated version of this page.

## How it works (verified behaviour)

- **Lists the shops you can manage.** On open, it loads the shops the signed-in user has
  permissions on and renders each as a card with a monogram, the shop name, its seller ID, and
  the user's **role / permission badges**.
- **Enter the dashboard.** Each card has an "Enter Dashboard" action that opens that shop's
  seller dashboard.
- **Leave a shop.** A card also offers a "Leave shop" action that removes the user's own access
  to that shop (see SL-02).
- **Shared context.** The whole `sellerProfile` area is wrapped in a `SellerProfileProvider`, so
  the selected shop and its permissions are available to every dashboard screen.

## Data source

| Item | Value |
|------|-------|
| Shops list | `SellerDashboardService.getShopes()` → `GET /shop/auth/permissions` (`services/sellerDashboard/index.ts`) |
| Per-shop data | `seller_id`, shop name, the user's role and grouped permissions |
| Shared state | `sellerProfile/SellerProfileContext.tsx` (`SellerProfileProvider`) |

## Technical reference

| Item | Value |
|------|-------|
| Shop picker | `app/(client)/[lang]/sellerProfile/page.tsx` ("Your Shops") |
| Area layout | `app/(client)/[lang]/sellerProfile/layout.tsx` → `SellerProfileProvider` |
| Dashboard route | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` |
| Service | `services/sellerDashboard/index.ts` (market / market-dashboard backends, `sellerId` header) |

## Current status & maturity

**Live and stable** as the dashboard entry point. Permission-gated end to end.

## Known gaps / notes

- **"Sales" banner shows a hardcoded `0`.** The seller entry widget in the account/settings
  menu (`components/settings/GoToSellerDashBoard.tsx`, the dark card with `data-cy="seller-sales"`
  that links to `/sellerProfile`) renders `{0} Action` under the "Sales" label — the `0` is a
  literal, not real data. The component only calls `getShopes()` → `GET /shop/auth/permissions`,
  which returns **no counts** (each shop is just `seller_id` / `shop_name` / `shop_role` /
  `permissions[]`), so there is no number available to display today. Wiring a real value would
  require either a new backend count on `/shop/auth/permissions`, or a per-shop
  `getSellerOrders()` → `data.meta.total` aggregation (one request per shop, since the banner is
  global and a user can own several shops). The intended metric is also ambiguous — the heading
  says "Sales" but the value is labelled "Action". **Left as-is by decision (2026-07-08);**
  documented here rather than patched.

## Related features

SD-17 (the *public* boutique storefront) · SL-02 (Leave a shop) · SL-03…SL-14 (the dashboard
this page opens).
