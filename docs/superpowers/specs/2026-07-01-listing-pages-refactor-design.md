# Listing Pages Refactor — Design

**Date:** 2026-07-01
**Scope:** `/featured`, `/flashDeals`, `/filters` listing pages + home Featured/Flash strips + PDP related-products, including all sub-components and the paginated fetch layer.
**Goal:** Return **plain serializable data** from server actions/fetches (no JSX crossing the server→client boundary), render from that data, remove duplication (DRY), split oversized files, and land a substantial performance + correctness improvement — **without breaking existing behavior**.

---

## 1. Decisions (locked)

| Decision | Choice |
|---|---|
| Product card strategy | **One client `ProductCard`, used everywhere** (initial SSR grid + pagination + home strips + related). Single prop shape, single source of truth. |
| SSR model | **Keep the first page server-rendered** (real HTML in source for SEO). Only pagination fetches + renders client-side. A client component still SSRs for initial HTML, so SEO is preserved. |
| Filter cleanup depth | **Data refactor + targeted splits** of the worst offenders (`FilterItem` 778, `FilterList` 744). No open-ended rewrite of the whole filter tree. |
| Card scope | **Listing pages + home strips + related-products** — retire every duplicated `ProductWrapper` prop-building block. |
| Pagination state | **Local component state/refs** (as today), storing data instead of JSX. Remove the legacy unused `getProducts`/`getNextProducts` store actions. |
| Performance appetite | **Tier A + Tier B this pass.** Tier C deferred to `docs/listing-perf-tier-c-followups.md`. |

---

## 2. Current reality (why this refactor)

All three routes + the two home strips share one engine: they call `getProductsAndFiltersFromElastic` (`services/elastic/elasticSearch.ts:214`) **directly against Elasticsearch** — not `fetchData`/endpoint constants. Two render paths exist:

- **Initial page (first ~10):** `ProductListContainer` → `ProductListServer` takes a **plain `productsData` array** and renders `<ProductWrapper>` server-side. Already "data in, JSX at the leaf" — SEO-friendly.
- **Pagination:** `GetProducts` / `GetNextPageFilters` / `GetRelatedProducts` build the **same** clean `productsData`/`new_filters` object, then throw it away by `.map(... => <ProductWrapper/> | <FilterItem/>)`, streaming pre-rendered React (Flight) elements. The client stores those *elements* in `useState` and dumps them as `{products}` / `{filterItems}`.

The serializable shape already exists inside every one of those functions immediately before the `.map`. `offset`, `pit_id`, `productIds`, `GA_PRODUCTS_LIST` are already data; only the `items`/facet arrays are JSX. Dedup already keys off the parallel `productIds` array.

**Structural blocker (resolved by the decisions):** `ProductWrapper` (430 lines) and `FilterItem` (778 lines) are server components embedding client children, so they can't be rendered from client state today. → We build one client `ProductCard` and make `FilterItem` renderable from a plain option, used for both SSR (first page) and client (pagination).

**Duplication hotspots:** the product-card props are built identically in 3+ places (`GetProducts:209-239`, `GetRelatedProducts:488-518`, `ProductListServer:30-64`, plus home wrappers); `featured` and `flashDeals` pages/wrappers/strips are near-duplicates.

---

## 3. Target architecture

### 3.1 One normalized data contract
- **`ListingProduct`** type — the serializable card shape: `id, slug, name, images, videos, colors, sync_color_images, category_tree, label_names, brand{id,icon,is_verified}, price, offer_price, luck_price, is_luck, flash_deal_price, flash_deal_end_date, categories`.
- **`normalizeListingProduct(rawHit)`** — one mapper ES hit → `ListingProduct`. Every fetch path calls it; deletes the 4 duplicated literals.
- **`FilterOption`** type — `{ term, item, ... }` — the serializable facet-chip shape.

### 3.2 Server actions return data, never JSX
```
GetProducts        → { products: ListingProduct[], offset, pit_id, recomended_offset, productIds, GA_PRODUCTS_LIST }
GetRelatedProducts → { products: ListingProduct[], offset, pit_id, total_size, productIds }
GetNextPageFilters → { categories: FilterOption[], brands, colors, sizes, prices, total_size }
GetFilters         → { categories: FilterOption[], brands, colors, sizes, prices, total_size }
```
Non-list fields are already data and stay unchanged.

### 3.3 One client `ProductCard` (`"use client"`)
Renders from `ListingProduct`. Used by:
- **Initial SSR grid** — server renders `<ProductCard>` from `productsData` (real HTML → SEO preserved).
- **Pagination** — `ProductInfiniteScroll` holds `ListingProduct[]` and maps to `<ProductCard>` client-side.
- **Home strips + related** — same card.

`ProductWrapper`'s leaf pieces (`RenderPrice`, `ImageAvatar`, flash/price date math) fold into `ProductCard`; its already-client children (`ProductButtonWrapper`, `ProductColorsBottomSheet`, `ProductPhotosWrapper`) are reused as-is.

### 3.4 Filters mirror the pattern
`FilterItem` becomes renderable from a plain `FilterOption` on the client; `InfiniteScrollFilters` holds `FilterOption[]` and maps to `<FilterItem>` — matching `InfiniteScrollFilterSearch`, which is already data-only (our proven template).

---

## 4. Performance & correctness work — Tier A + B (this pass)

All file:line references confirmed against the working tree.

### Tier A — high impact, low risk
**Rendering / React**
- **Whole-store subscriptions → slice selectors.** `Product.tsx:22`, `BuyButton.tsx:98`, `ProductInfiniteScroll.tsx:38`, `FiltersWindow/index.tsx:23,51` call `useAppStore()` with no selector → re-render on any cart/chat/auth change. Use `useAppStore(s => s.x)`; for pure actions `useAppStore.getState().x`.
- **N per-card 1s timers.** `FlashDealBanner.tsx:53` runs a `setInterval` per flash card and does not pause off-screen (unlike `LuckyDrawer`, which already gates via IntersectionObserver). Drive countdowns from a single shared 1s ticker and/or visibility-gate.

**Images (pure wins)**
- **`quality={100}` rejected by config** — `next.config.ts:116` allows `qualities:[70,65]`. Align product image quality (`ProductWrapper:270,310,322`) to an allowed value.
- **`loading="eager"` on all images + missing `sizes`.** `ProductWrapper:269,311,353`; declared `width={400}` rendered at `200px`. Use `loading="lazy"` below the fold, `sizes="200px"`, `priority` only on the first row.

**Filters (server-render CPU)**
- **`FilterItem` O(chips × repeats) URL rebuild.** `shouldShowSubCategories()` full descendant scan re-run ~10×/category; `getSubCategoryUrl()` called 3× per child/grandchild (`FilterItem.tsx:65-81,176-308`). Compute once, reuse. Fold into the FilterItem split.
- **`FilterList.getItemData` re-flattens the tree ~7×/category** (`FilterList.tsx:155-174`). Flatten to a `Map<slug,node>` once in `ActiveFiltersBar`.

**Network / correctness**
- **`/filters` doesn't stream.** `FiltersPageContent.tsx:122` `await Promise.all(...)` withholds the whole HTML shell for full ES latency, while `/featured` streams via Suspense (`featured/page.tsx:75-89`). Pass un-awaited promises into `<Suspense>` for consistency + TTFB win.
- **`noProducts` still fetches 10 full hits** unless the price flag is on. Set `searchQuery.size = 0` whenever `noProducts` is true, independent of `LISTING_PRICE_AGG_ENABLED`.

### Tier B — high impact, moderate effort (done carefully)
- **`_source` over-fetch (~55 fields, ~15 used).** Trim `getSourceFields()` (`helpers.ts:15-86`) — drop `custom_products.details`, `custom_boutiques.banners`, unused category photo variants — after confirming no card field reads them.
- **`track_total_hits: true` on pagination** (`elasticSearch.ts:306`). Use `false`/bounded on `noFilters` load-more pages.
- **`FiltersWindow` monolithic state** (`index.tsx:66`) re-renders the whole modal + slider + chart on any chip toggle. Split price state from chip state; also fixes the `useEffect`/`JSON.stringify` churn (`:88,407`).

---

## 5. Migration sequence (non-breaking)

1. **Contract first** — add `ListingProduct` + `normalizeListingProduct()`; refactor the 4 duplicated literals to use it. No behavior change.
2. **`ProductCard`** — build from `ListingProduct`, folding in leaves + Tier-A image/timer/selector fixes. Swap into the **initial SSR grid first**; verify visual + analytics parity before touching pagination.
3. **Data-returning product actions** — `GetProducts`/`GetRelatedProducts` return `products: ListingProduct[]`; `ProductInfiniteScroll`/`RelatedProductsInfiniteScroll` hold data and map to `<ProductCard>`. Dedup keys off `productIds` (unchanged).
4. **Filters** — `FilterOption` shape; `GetNextPageFilters`/`GetFilters` return data; `InfiniteScrollFilters` maps to `<FilterItem>`. Apply FilterItem/FilterList compute-once fixes during the split.
5. **Home strips + related** — point at `ProductCard`; retire remaining duplication.
6. **Network fixes** — `/filters` streaming, `noProducts` size=0, `_source` trim, `track_total_hits`.
7. **Cleanup** — remove the legacy `getProducts`/`getNextProducts` store actions.

### Targeted splits
- `FilterItem` (778) → chip markup + pure URL-state helpers hoisted to `utils/server`.
- `FilterList` (744) → bar + `ActiveFiltersBar` + row.
- `ProductWrapper` leaves → `ProductCard`.
- No rewrite of `FiltersWindow` internals beyond the state split.

---

## 6. Safety & verification (no test suite)
- Each phase keeps the old path working until parity is confirmed.
- `ProductCard` proven on the SSR grid before pagination is switched.
- Gate: `pnpm build` + `pnpm lint` + type-check clean.
- **Analytics parity:** GA `VIEW_ITEMS_LIST` / PostHog events flow through this path — verify event names + payloads unchanged (per CLAUDE.md, document any new PostHog event in `docs/posthog-events.md`).
- Manual smoke on all three routes + home strips + PDP related, in en/ar (RTL) at mobile + desktop breakpoints.

---

## 7. Out of scope (this pass)
- **Tier C** performance work — grid virtualization, ES query parallelization/msearch, and a caching layer. Captured in **`docs/listing-perf-tier-c-followups.md`** for a focused follow-up.
- The hardcoded GitLab token in `package.json` (tracked separately).
- Any change to the mobile API route (`app/api/products/searchInCatalog`) beyond what the shared helpers imply — noted in the Tier C file.
