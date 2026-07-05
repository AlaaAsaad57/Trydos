# SD-29 — Related Products

| | |
|---|---|
| **Feature ID** | SD-29 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/RelatedProductsSection.tsx`, `serverRequests/listing/index.tsx`, `services/elastic/elasticSearch.ts` |

---

## What it is

The **"You May Also Like"** strip near the bottom of a product page — more products similar to
the one being viewed.

## Where it appears

On the product page (SD-19), below the reviews/FAQ, as a horizontal strip with load-more.

## Who uses it

Every shopper — a way to keep browsing similar items.

## How it works (verified behaviour)

- **Category/audience based, not personalised.** Related items are chosen by matching the current
  product's **audience** — the gender + age-group pairs on its categories — and returning other
  active products that share at least one of those pairs (excluding the current product).
- **Ranked by relevance.** Sorted by search relevance, then a stable tie-breaker.
- **Loads a few at a time.** Starts with 3 and pages more as the shopper scrolls the strip, using
  the same snapshot-cursor pagination as the main listing.
- **If the product has no gender/age-group categories, the strip is empty.**

## Data source

| Item | Value |
|------|-------|
| Related items | `GetRelatedProducts` (`serverRequests/listing/index.tsx`) → `getRelatedProducts` (`services/elastic/elasticSearch.ts`) |
| Match logic | Elasticsearch: current product's category `{gender, group_age}` pairs → other active products sharing ≥1 pair |
| Page size | **3** per page (initial + load-more) |
| Pagination | Point-in-Time snapshot cursor (ADR-009) |

## Technical reference

| Item | Value |
|------|-------|
| Section | `components/Server/product/RelatedProductsSection.tsx` ("You May Also Like") |
| Scroller | `components/Product/RelatedProductsInfiniteScroll.tsx` |
| API route | `app/api/related-products/[id]/route.ts` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-06 (Personalised recommendations — different mechanism) · SD-14
(Listing engine that shares the pagination).
