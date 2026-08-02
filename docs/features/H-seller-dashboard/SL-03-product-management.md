# SL-03 — Product Management

| | |
|---|---|
| **Feature ID** | SL-03 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderProducts`), `services/sellerDashboard/index.ts`, `services/sellerDashboard/comments.ts` |

---

## What it is

The **Products** tab of the seller dashboard — a browsable grid of everything the shop sells, each
card showing its photo, name, price, live stock level, active/inactive status, and a row of social
stats (reactions, questions, reviews, shares). Tapping a card opens the full product editor (SL-04),
and an **"+ Add Product"** button starts a brand-new one.

## Where it appears

- Inside the seller dashboard → **Products** tab.
- Each product card links to `…/sellerDashboard/<sellerId>/products/<productId>` (the editor).
- **"+ Add Product"** (shown only with `CREATE_PRODUCT`) links to `…/products/new`; the empty state
  offers the same as "Add your first product".

## Who uses it

**Sellers / shop staff** with any product permission (see gating below).

## How it works (verified behaviour)

- **Loads on first open.** Products are fetched the first time the tab is opened and then cached
  (kept in shared context), so switching away and back doesn't re-fetch page 1.
- **Each card shows:** the first product image (or a "No Image" placeholder); the category name;
  the product name (or "Unnamed Product"); the unit price to 2 decimals **followed by the shop's own
  currency code**; and two badges.
- **Status badge:** green **"Active"** when `status === 1`, otherwise grey **"Inactive"**.
- **Stock badge:** red **"Out of stock"** at 0; amber **"{n} in stock"** when 5 or fewer; grey
  **"{n} in stock"** otherwise.
- **Social stats row:** four inline counters — Reactions, Questions, Reviews, Shares. They show a
  dash (`—`) until the counts load, then the number (0 if absent). These counts are fetched
  separately and are permission-gated on the server by `READ_COMMENTS`; if you lack it they stay `—`.
- **Pagination:** shown only when there's more than one page; Prev/Next re-fetch the corresponding
  page. Page size is decided by the backend (no client-side page-size).

## Data source

| Item | Value |
|------|-------|
| Product list | `SellerDashboardService.getSellerProducts(sellerId, page)` → **GET `/shop/products`** (`?page=N` from page 2), `market-dashboard` backend, shop-scoped by seller ID |
| Currency shown on cards | `dashboardShopInfo.currency.code` in the store — filled once per shop by `ShopInfoLoader` (**GET `/shop/info`**) |
| Social counts | `sellerCommentsService.GetProductsSocial(...)` → `getSellerProductsSocial` **server action** reading Elasticsearch directly (`comments_index`, `share_index`, `product_interactions_index`); batched ≤100 IDs |

## Technical reference

| Item | Value |
|------|-------|
| Tab renderer | `page.tsx` → `renderProducts()` |
| Fetch | `page.tsx` → `getSellerProducts()` |
| Social lazy-load | `page.tsx` effect → `services/sellerDashboard/comments.ts` → `services/elastic/sellerComments.ts` |
| Permission gate | `canViewProducts` = any of `READ_PRODUCTS / CREATE_PRODUCT / UPDATE_PRODUCT / CHANGE_PRODUCT_STATUS` (or `SUPER_ADMIN`) |
| State | Shared `SellerProfileContext` (`sellerProducts`) + local `productsMeta`, `productsSocial` |

## Current status & maturity

Live and stable as a browsing/overview screen. Permission-gated end to end; social counts degrade
gracefully to `—` when unavailable.

## Known gaps / notes

- Prices are shown raw (`toFixed(2)`) with no locale formatting; if the shop's currency can't be read
  (e.g. no `READ_SHOP_INFO`) the number is shown with no currency code at all. *(The previous
  hardcoded "USD" label is fixed.)*
- Social counts fail silently: if the counts can't be loaded (e.g. missing `READ_COMMENTS`) the four
  stats stay `—` with no error shown (the failure is only logged).

## Related features

SL-04 (Product editing / adding) · SL-05 (Activate / allow purchase) · SL-09 (Product image gallery) ·
SL-11 (Comments & reviews management) · SL-14 (Roles & permissions viewer) · SL-15 (Locations).
