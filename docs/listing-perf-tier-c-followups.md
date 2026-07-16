# Listing Performance — Tier C Follow-ups (deferred)

**Created:** 2026-07-01
**Status:** Deferred — NOT part of the 2026-07-01 listing refactor pass (which covers Tier A + B).
**Why deferred:** Highest-value performance wins, but each has a large blast radius and touches scroll/SEO/ES-core behavior that is hard to verify without a test suite. Each deserves its own focused change + manual verification.

Parent design: `docs/superpowers/specs/2026-07-01-listing-pages-refactor-design.md`.

---

## C1 — Grid virtualization (windowing)
**Problem:** No windowing today. `ProductInfiniteScroll.tsx:59,174,270` keeps every fetched page mounted → unbounded DOM growth + unbounded live per-card timers as the user scrolls.
**Win:** Largest scalability/memory win; caps live timers and in-flight image loads by unmounting off-screen cards.
**Risk:** Changes scroll restoration, may affect SSR/crawler visibility of lower cards, interacts with the `InView` sentinel and the shared-ticker timer design. Prereq: `ProductCard` (data-driven) from the main refactor must land first.
**Notes:** Verify crawler still sees the SSR first page; confirm scroll-position retention on back-nav.

## C2 — Collapse the serial ES waterfall
**Problem:** `/filters` worst-case first load runs in series (all confirmed in `services/elastic/elasticSearch.ts` / `helpers.ts`):
1. `AnalyzeSearchText` (Gemini `gemini-2.5-flash-lite`) for any multi-word search — `elasticSearch.ts:239-240`, before the ES query is even built.
2. Main ES query — `_source` (55 fields), `track_total_hits:true`, facet aggs, price phase-1.
3. `getChildrenAndGrandchildren` — a second `client.search` (`elasticSearch.ts:558`, `helpers.ts:2202`), awaited sequentially.
4. Price phase-2 histogram — a separate `size:0` `client.search` (`elasticSearch.ts:412-429`) when `LISTING_PRICE_AGG_ENABLED` + `!noFilters` + `max>min`.
**Win:** Removes 1–3 serial round trips from the blocking window on facet-bearing loads.
**Options:**
- Run `getChildrenAndGrandchildren` in parallel with the main query (or fold into main `aggs`).
- `msearch` phase-1 + phase-2 price aggs, or compute the histogram interval up front and issue concurrently.
- Move Gemini analyze off the blocking path: run concurrently with a short time budget, merge only if it resolves in time; otherwise fall back to the raw search text.
**Risk:** Touches the ES core used by web + mobile API; correctness of merged aggregations must be re-verified (price agg invariants — see the `price-agg-index-invariants` memory).

## C3 — Caching layer for ES reads
**Problem:** No caching anywhere (`elasticSearch.ts` calls `client.search` directly; pages are `force-dynamic`; API route `no-store`). Identical popular listing/facet queries re-hit ES every request.
**Win:** Large latency + ES-load reduction for anonymous, filter-light, popular loads.
**Approach:** `unstable_cache([...], { revalidate: N, tags:[...] })` keyed on country/language/filters for anonymous loads; leave personalized/recommendation paths uncached.
**Risk:** Cache-key + invalidation design is non-trivial (country/currency/language/price-override matrix); stale price/stock risk. Must respect per-country price overrides.

## C4 — Mobile API route over-fetch
**Problem:** `app/api/products/searchInCatalog/route.ts:62-79` — `noFilters`/`noProducts` wiring is commented out, so every mobile pagination call recomputes the full `buildAggregations` + the `getChildrenAndGrandchildren` second query even for pure "load more products".
**Win:** Cuts facet aggregations + a second ES round trip per mobile scroll page.
**Fix:** Set `noFilters:true` for product-only pagination requests on this route.
**Risk:** Low-moderate, but it's the mobile contract — confirm the mobile app doesn't rely on facets in the paginated response.

## C5 — Misc lower-priority
- `logSearchTerm` (`elasticSearch.ts:679`) — extra ES write per successful search (fire-and-forget, not latency; batch if write volume matters).
- Hoist static inline SVG icon components to module scope (`Product.tsx:76`, `LuckyDrawer.tsx:110/133/151`, `BuyButton.tsx:99`, `FlashDealBanner.tsx:58`) — React Compiler mitigates, low priority.
- `ProductWrapper` server-side redundant recompute (`rearrangedImages()` called at `:138` and `:140`; name string rebuilt `:366-368`) — server render, low priority; moot once folded into `ProductCard`.
