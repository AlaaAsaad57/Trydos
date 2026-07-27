# SD-32 — Product Comparison

| | |
|---|---|
| **Feature ID** | SD-32 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `utils/functions.tsx`, `components/global/compare.tsx`, `app/(client)/[lang]/compare/page.tsx`, `components/products/MoreOptionsSection.tsx` |

---

## What it is

A **side-by-side comparison** of two products. A shopper adds products to a compare list and opens
a dedicated page that lays them out in two columns — name, image, colours, sizes, price, offer
price and description.

## Where it appears

- **Adding** happens on the product page (SD-19), from the "Add To Compare" action inside the
  **More-options menu** (SD-30).
- **Viewing** is a dedicated page at **`/{lang}/compare`**, reached from the **"Compare" item in
  the side menu**. The page also has two search boxes so a shopper can pick or swap either product
  directly on the page.

## Who uses it

Any shopper — guest or logged-in alike; the compare list is stored locally in the browser, so no
account is involved.

## How it works (verified behaviour)

- **The compare list holds exactly two products**, stored in two browser cookies: `f_p` ("first
  product") and `s_p` ("second product"), each holding a product's slug. Cookies last **1 year**.
- **Adding when both slots are full replaces the first product** (`f_p`) with the new one — the
  toast still just says "Added To Compare", with no mention that something was replaced.
- **Removing is smart:** removing the first product promotes the second into its place; removing
  the second just clears it.
- **The compare page reads the two slugs** (from the URL first, then cookies) and fetches each
  product's details from the backend **for display only** — the list itself is never saved
  server-side.
- **Compared attributes:** name (linked), image, colours, sizes, price, offer price, and details
  (rich HTML). Ratings/reviews are **not** compared.
- **Toasts:** add → "Added To Compare! Click To Go To Compare Page" (5-second duration); remove →
  "Removed From Compare". The button turns green and reads "Added To Compare" while active, kept in
  sync via a custom `compare-changed` window event and on window focus.
- **Not-found handling:** if a saved slug can't be fetched, its cookie is cleared and the page
  shows "One of the products was not found…".

## Data source

| Item | Value |
|------|-------|
| Compare list storage | Browser cookies `f_p` / `s_p` (product slugs) — **client-only, no backend persistence** |
| Product detail (display) | `GET /web/product/globalDetails/{slug}` + `GET /web/product/qtyPriceDetails/{slug}` — fetched in parallel through the app's own request layer (`server: "market"`), **not** by calling a backend host from the browser. `globalDetails` is cached; `qtyPriceDetails` never is, because it carries live price and stock |
| On-page product search | `/api/products/searchInCatalog` |
| Store usage | Zustand only for `currency` + navigation flag — **not** for compare membership |

## Technical reference

| Item | Value |
|------|-------|
| Add / remove logic | `utils/functions.tsx` — `addToCompare` / `removeFromCompare` + `notifyCompareChanged` (`compare-changed` event) |
| Cookie defaults | `utils/cookies/cookie-manager.ts` — `path=/`, `sameSite=strict`, 1-year `maxAge`, client-readable |
| Compare page | `components/global/compare.tsx` (`ComparePage`) |
| Route | `app/(client)/[lang]/compare/page.tsx` → `/{lang}/compare` |
| Add-to-compare button | `components/products/MoreOptionsSection.tsx` (mounted via `ExtendedAreaInfo.tsx`) |
| Nav link | `components/Home/Menu.tsx` ("Compare" menu item) |

## Current status & maturity

**Live and stable.** The core two-product comparison works end to end. It is intentionally capped
at two items and is entirely cookie-based (nothing is saved to an account). The remaining notes
below are either app-wide (raw HTML rendering) or cosmetic — not compare-specific functional gaps.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-30 (More-options menu — where adding lives) · SD-19 (Product page) · SD-31 (Wishlist — sibling
cross-cutting action) · SD-16 (Sort) / SD-15 (Filter — other listing-side shopper controls).
