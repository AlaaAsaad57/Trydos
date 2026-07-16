# SD-13 — In-Catalog Search (within a listing / boutique)

| | |
|---|---|
| **Feature ID** | SD-13 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Server/ListingSearchContainer.tsx`, `app/api/products/searchInCatalog/route.ts` |

---

## What it is

A search box **on listing pages** that searches within the current context — the boutique,
category, featured or flash-deal listing the shopper is already looking at — rather than the
whole store.

## Where it appears

- In the top bar of listing pages: the featured page (`/{lang}/featured`), flash-deals page
  (`/{lang}/flashDeals`), boutique and category listings, and the general filters page.

## Who uses it

Shoppers who are already browsing a store/category and want to search **inside it**.

## How it works (verified behaviour)

- The listing page renders a search container (`ListingSearchContainer` → `SearchBoutiquePage`)
  that is seeded with the page's current context: the **boutique / featured / flash-deal**
  flags, the already-applied filters, and any existing search text.
- Searching keeps that context, so results stay scoped to the current catalogue.
- The catalogue search endpoint (`/api/products/searchInCatalog`) returns products **plus** an
  inline **autocomplete suggestion** (computed in parallel, best-effort) and the applied
  filters, and supports the same `?sort=` options as the rest of the listing.
- This endpoint also powers the **mobile app's** listing search ("mobile parity" in the code)
  and supports an opt-in, snapshot-consistent pagination mode (Point-in-Time) that is gated by
  a server flag.

## Data source

| Item | Value |
|------|-------|
| UI (server) | `components/Server/ListingSearchContainer.tsx` → `components/filterPage/SearchBoutiquePage` |
| API | `app/api/products/searchInCatalog/route.ts` (`GET`) |
| Engine | `getProductsAndFiltersFromElastic()` (Elasticsearch) |
| Extras | inline suggestion via `GetSearchSuggestion`; `?sort=`; opt-in PIT pagination (`use_pit`, gated by `LISTING_PIT_ENABLED`) |
| Accepted filters | categories, boutiques, brands, colours, sizes, price, flash-deal, featured, search text |

## Technical reference

| Item | Value |
|------|-------|
| Container | `components/Server/ListingSearchContainer.tsx` |
| Renders | `SearchBoutiquePage` (`components/filterPage/`) with `featured` / `flashdeal` / `parsedFilters` / `search_text` |
| API default page size | 20 |
| Pagination | stateless `offset` by default; opt-in Point-in-Time (ADR-009) when enabled |

## Current status & maturity

**Live and stable**, and shared with the mobile app.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-07 (store-wide search overlay) · SD-14 (Listing page) · SD-15 (Filter panel) · SD-16 (Sort).
