# SD-14 — Product Listing Page

| | |
|---|---|
| **Feature ID** | SD-14 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Listing/FiltersPageContent.tsx`, `components/ListingPage/ProductInfiniteScroll.tsx`, `serverRequests/listing/index.tsx`, `services/elastic/elasticSearch.ts` |

---

## What it is

The **product grid** — the scrollable page of product cards that shoppers land on whenever
they browse. It is a single shared engine that powers **every** listing in the app: category
pages, a boutique's storefront, the Featured page, the Flash-Deals page, and search results.
New products load automatically as the shopper scrolls to the bottom (infinite scroll); there
is no "next page" button.

## Where it appears

One engine, reached through several URLs:

- **Search / category / boutique / generic listing** → `/{lang}/filters/…`
  (e.g. a boutique is `/{lang}/filters/boutiques/<slug>`, a category is
  `/{lang}/filters/categories/<slug>`, a search is `/{lang}/filters/search/<term>`).
- **Featured page** → `/{lang}/featured`
- **Flash-deals page** → `/{lang}/flashDeals`
- Also as an **overlay** version, opened without leaving the current page (intercepted modal
  route — same page, shown on top).

## Who uses it

Every shopper — this is the main browsing surface of the store.

## How it works (verified behaviour)

- **One shared engine.** All listing URLs render the same grid. The filters/category/boutique/
  search routes share the exact `FiltersPageContent` component; Featured and Flash-Deals use a
  near-identical copy of that layout with a "featured" or "flash-deal" flag switched on.
- **Streamed for speed.** The first page of products is rendered on the server and streamed to
  the browser (React Suspense), so the shopper sees products quickly while the rest loads.
- **Infinite scroll.** A hidden marker sits at the bottom of the grid; when it comes into view
  (at 50% visible), the next page is fetched automatically. Products load in **pages of 10**.
- **Knows when to stop.** Scrolling stops fetching when a page comes back empty, or shorter
  than a full page, or the position marker hasn't advanced.
- **No duplicates.** Every product ID already shown is remembered, so a product never appears
  twice. If a whole page turns out to be duplicates, the engine quietly skips ahead — but only
  up to 5 times in a row, as a safety limit.
- **Consistent order while you scroll.** Pagination uses a snapshot cursor (a "point-in-time"
  view of the catalogue) so items don't shuffle between pages as you scroll — this is
  gated by a server flag (see gaps).

## Data source

| Path | How |
|------|-----|
| Products & facets | `getProductsAndFiltersFromElastic()` (`services/elastic/elasticSearch.ts`) — queries the **Elasticsearch `catalog_index`** directly. |
| Server actions | `serverRequests/listing/index.tsx` — `GetProducts` (next page of products), `GetFilters` / `GetNextPageFilters` (filter facets), `GetRelatedProducts`. |
| First page (SSR) | Rendered server-side inside `FiltersPageContent` → `ProductListConainer` → `ProductList`. |
| Later pages (client) | `ProductsInfiniteScroll` calls the `GetProducts` server action on scroll. |

## Technical reference

| Item | Value |
|------|-------|
| Shared engine | `components/Listing/FiltersPageContent.tsx` |
| Scroll engine | `components/ListingPage/ProductInfiniteScroll.tsx` (`ProductsInfiniteScroll`) |
| First-page grid | `components/Server/ProductListConainer.tsx` → `components/Server/ProductList.tsx` |
| Sort-aware wrapper | `components/Server/SortableGrid.tsx` (see SD-16) |
| Page size | **10** per page (server actions + scroller `PAGE_LIMIT`) |
| Scroll trigger | `react-intersection-observer` `<InView threshold={0.5}>` sentinel |
| Pagination model | `search_after` cursor + Point-in-Time snapshot (ADR-009), **not** offset paging |
| Routes | `app/(client)/[lang]/{filters,featured,flashDeals}/[[...filters]]/page.tsx` (all `runtime = nodejs`, `dynamic = force-dynamic`) |
| Store slice | `store/listing/reducer.ts` (UI flags: `filterEnabled`, `skeleton`, `showedFilter`…) |

## Current status & maturity

**Live and stable**, and actively hardened — recent work added the point-in-time pagination
(ADR-009), duplicate-guarding, and a loader reset. This is one of the most heavily used and
most-developed surfaces in the app.

## Known gaps / notes


- **Featured & Flash-Deals duplicate the layout** rather than importing the shared component,
  so the three routes can slowly drift apart in behaviour over time (a maintenance note, not a
  shopper-visible bug).


## Related features

SD-15 (Filter panel) · SD-16 (Sort) · SD-17 (Boutique storefront) · SD-18 (Quick-view modal) ·
SD-03 (Featured) · SD-04 (Flash deals) · SD-07 (Search overlay that opens this page).
