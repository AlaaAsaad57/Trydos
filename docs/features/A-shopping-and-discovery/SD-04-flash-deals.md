# SD-04 — Flash Deals

| | |
|---|---|
| **Feature ID** | SD-04 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/ServerWrapper/FlashDealsProduct.tsx`, `components/Server/FlashDealsProducts.tsx`, `components/products/FlashDealBanner.tsx` |

---

## What it is

A horizontal strip of **time-limited discounted products** on the homepage, each showing a
live countdown, plus a dedicated full "Flash deals" listing page.

## Where it appears

- **On the homepage** (`/{lang}`) — a scrollable row directly under Featured products.
- **Full page:** `/{lang}/flashDeals` — the "see all" listing.

## Who uses it

Every shopper. It drives urgency and promotes discounted stock.

## How it works (verified behaviour)

### Homepage strip
- **What's shown:** up to **10** flash-deal products for the shopper's country and language,
  narrowed to the active homepage category filter if one is set (`?mainCategory=`).
- **Empty state:** if there are no flash deals, the whole section is hidden.
- **Layout:** a section header labelled "Flash deals" (translated) linking to
  `/{lang}/flashDeals`, followed by a horizontal scroll of product cards.
- **"Show More" tile:** appears at the end when **more than 8** products are returned,
  linking to `/{lang}/flashDeals`.

### Countdown banner (per product)
Each flash-deal product carries a live countdown badge (`FlashDealBanner`):
- Counts down to the deal's end date, treated as the **end of that day (23:59:59)**.
- Displays days + `HH:MM:SS`, styled in the orange flash-deal theme, labelled "Flash Deal".
- **Performance-aware:** the 1-second timer only ticks while the badge is actually **on
  screen** (visibility observer) **and** the browser tab is active; it stops otherwise. This
  mirrors the same visibility gating used by the luck-timer.
- When the deal expires, the badge hides itself.

### Full "Flash deals" page (`/{lang}/flashDeals`)
- Same full listing experience as Featured (filter panel, in-catalog search, sort, share),
  but showing products where **flash-deal = true** (featured = false).
- Rendered fresh per request (`force-dynamic`, Node.js runtime), page size 10, supports
  URL filter segments and `?sort=`.

## Data source

| Where | How |
|-------|-----|
| Homepage strip | `GetFlashDealProducts({ language, country, category, limit: 10 })` → `getProductsAndFiltersFromElastic()` with `filters.flashdeal = true`. |
| Full page | `getProductsAndFiltersFromElastic()` with `flashdeal: true, featured: false`. |

All data comes from the **product search index (Elasticsearch)**.

## Technical reference

| Item | Value |
|------|-------|
| Homepage wrapper | `components/ServerWrapper/FlashDealsProduct.tsx` (`FlashProductWrapper`) |
| Homepage renderer | `components/Server/FlashDealsProducts.tsx` |
| Countdown badge | `components/products/FlashDealBanner.tsx` (client component) |
| Full page | `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` |
| Homepage limit | 10 products; "Show More" tile appears when `> 8` returned |
| Countdown end | `end_data` date, forced to `23:59:59.999` of that day |
| Timer gating | `IntersectionObserver` (threshold 0.1) + `document.hidden` |
| Streaming skeleton | `FeaturedProductsSkeleton` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

- The countdown resolves to the **end of the deal's end-day** (23:59:59), not an arbitrary
  time-of-day — confirm this matches how the backend defines a deal's expiry when writing
  merchandising rules. (confirm it reffers to the end of the day of end-date day)

## Related features

SD-01 (Homepage feed) · SD-03 (Featured — same pattern, different flag) · SD-14 (Listing
engine) · SD-33 (Product card).
