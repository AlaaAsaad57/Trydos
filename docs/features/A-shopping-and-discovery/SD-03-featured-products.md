# SD-03 — Featured Products

| | |
|---|---|
| **Feature ID** | SD-03 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/ServerWrapper/FeaturedProduct.tsx`, `components/Server/FeatureProducts.tsx` |

---

## What it is

A horizontal strip of highlighted ("featured") products on the homepage, plus a dedicated
full "Featured products" listing page for browsing them all.

## Where it appears

- **On the homepage** (`/{lang}`) — a scrollable row under the stories bar.
- **Full page:** `/{lang}/featured` — the "see all" listing.

## Who uses it

Every shopper. It surfaces merchandising-selected products prominently on the home screen.

## How it works (verified behaviour)

### Homepage strip
- **What's shown:** up to **10** featured products, fetched for the shopper's country and
  language. If a homepage category filter is active (`?mainCategory=`), only featured
  products in that category are shown.
- **Empty state:** if there are no featured products, the whole section is hidden (renders
  nothing).
- **Layout:** a section header labelled "Featured products" (translated) that links to
  `/{lang}/featured`, followed by a horizontal scroll of product cards (see SD-33 Product
  card).
- **"Show More" tile:** if **more than 8** products are returned, an extra "Show More" tile
  is appended to the end of the strip, also linking to `/{lang}/featured`.
- **Pricing:** each product is normalized with the shopper's currency and their
  redeemed-reward state (see SD-33) before display.

### Full "Featured" page (`/{lang}/featured`)
- A complete listing experience: filter panel, in-catalog search, sort control, and share
  button, showing products where **featured = true** (flash-deal = false).
- Rendered fresh per request (`force-dynamic`, Node.js runtime), initial page size 10,
  supports catch-all filter segments in the URL and a `?sort=` parameter.

## Data source

| Where | How |
|-------|-----|
| Homepage strip | `GetFeaturedProducts({ language, country, category, limit: 10 })` in `serverRequests/home.tsx` → `getProductsAndFiltersFromElastic()` with `filters.featured = true`. |
| Full page | `getProductsAndFiltersFromElastic()` with `featured: true, flashdeal: false`. |
| JSON API | `GET /api/products/featured` (forces `filters.featured = true`; accepts category/brand/boutique/colour/size/price/search filters via query params). |

All data comes from the **product search index (Elasticsearch)**.

## Technical reference

| Item | Value |
|------|-------|
| Homepage wrapper | `components/ServerWrapper/FeaturedProduct.tsx` (`FeaturedProductWrapper`) |
| Homepage renderer | `components/Server/FeatureProducts.tsx` |
| Full page | `app/(client)/[lang]/featured/[[...filters]]/page.tsx` |
| API route | `app/api/products/featured/route.ts` |
| Product normalizer | `utils/listing/normalizeListingProduct` |
| Homepage limit | 10 products; "Show More" tile appears when `> 8` returned |
| Streaming skeleton | `FeaturedProductsSkeleton` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-01 (Homepage feed) · SD-04 (Flash deals — same pattern, different flag) · SD-14
(Listing engine behind the full page) · SD-33 (Product card).
