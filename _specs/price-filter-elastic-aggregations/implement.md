---
ticket: price-filter-elastic-aggregations
stage: implement
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Implement — price-filter-elastic-aggregations

> Record of what was actually built, following `plan.md`.

## Changes made

- `services/elastic/helpers.ts` — added the global price-facet aggregation layer
  (no scripts, indexed-only): `buildPriceStatsAggregation` (Phase 1: merged
  min/max/count across P1 nested `country_offer_prices[C].offer_price` + P3 root
  `offered_price`, wrapped in a self-excluding NON-price filter context),
  `buildPriceHistogramAggregation` (Phase 2: aligned fixed-interval histograms
  over both populations, `min_doc_count: 1`), and the code-side merge/derive
  helpers `mergePriceStats`, `mergePriceHistogram`, `deriveEqualCountCards`
  (equal-count/quantile cards from the cumulative histogram), plus
  `priceHistogramInterval` and the `PRICE_CARD_COUNT = 5` /
  `PRICE_HISTOGRAM_BUCKETS = 25` constants. The legacy page-scan helpers
  (`calculatePriceRange`/`calculatePriceFilter`) are retained for the flag-off
  path.
- `services/elastic/elasticSearch.ts` — added the `LISTING_PRICE_AGG_ENABLED`
  path gate and the dev-only, production-suppressed `LISTING_PRICE_AGG_DEBUG`
  flag. When enabled and filters are needed: injects the `price_facet` stats agg
  built from the NON-price conditions (`buildBaseConditions({ ...filters,
  priceRange: undefined }, country)`), sets `size: 0` on the filters-only panel
  request (`noProducts`), and rebuilds `prices` as
  `{ min_price, max_price, priceRanges, histogram, total }` from the
  aggregations. Phase 2 (the fine histogram → curve + equal-count cards) runs as
  a `size: 0` aggregation-only follow-up request, gated to the panel
  (`noProducts`). Emits the structured `[price-agg]` debug log when the debug
  flag is on. Flag off ⇒ existing page-scan behavior unchanged.
- `components/ListingPage/filterComponents/FiltersWindow/index.tsx` — the price
  distribution curve (`SmoothPolygon`) now reads the finer `prices.histogram`
  when present, falling back to `prices.priceRanges` (flag-off legacy).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `services/elastic/helpers.ts`
- `services/elastic/elasticSearch.ts`
- `components/ListingPage/filterComponents/FiltersWindow/index.tsx`

All left as uncommitted working-tree edits on branch
`ticket/price-filter-elastic-aggregations` (created from `develop`).

## Deviations from plan

- **No `serverRequests/**` edit (protected path NOT touched).** `GetNextPageFilters`
  renders cards from `response.prices.priceRanges` using the preserved
  `{ min_price, max_price, products_count }` shape, so the new fields flow through
  unchanged. Protected-path impact = **NO** (for `/verify` VF-9/TR-3). The plan
  listed it only as "possibly touched under high_risk".
- **No `PriceShape.tsx` edit.** It already accepts a generic `{ mon, max, count }[]`,
  so the finer histogram needs no component change.
- **The "`max → min_price` slider typo" does not exist** in the current code —
  `FiltersWindow/index.tsx:366` already reads `max_price`. That plan step was a
  no-op; nothing changed.
- **Did not factor the price condition out of `buildBaseConditions`.** Instead the
  NON-price condition set is obtained by rebuilding
  `buildBaseConditions({ ...filters, priceRange: undefined }, country)` — same
  result, no signature change, fewer call-site edits (cleaner per the same goal).
- **Branch created from `develop`** (not `main`) per the repo branch strategy /
  project memory; `main` is never touched directly.
- Phase 2 histogram/cards are intentionally gated to the panel request
  (`noProducts`) so the product-grid path adds only the cheap Phase-1 stats agg —
  protects pagination latency (NFR-1/NFR-4) without changing behavior.

## Rework — post-implementation dev testing (2026-06-30)

Manual dev testing of `/sy-en/filters` surfaced the price section not rendering.
Root-caused two issues; both fixed within the planned files:

- **(in-scope bug I introduced)** Phase 2 (cards + histogram) was gated on
  `noProducts`, but the `/filters` page (`FiltersPageContent`) fetches via
  `getProductsAndFiltersFromElastic` **without** `noProducts` (it needs the grid),
  so the cards/curve never computed on the main render. Fixed in
  `services/elastic/elasticSearch.ts` by gating Phase 2 only on `!noFilters` +
  valid stats. Grid-only pagination (`GetProducts`) passes `noFilters:true`, so it
  is still excluded → no added pagination cost.
- **(pre-existing visibility gate)** `FilterWidgetServer` seeds the panel's
  `children` with `prices` but not `total_size`; the panel renders the price
  section only when `FiltersNodes.total_size > 1`, so on initial load (before any
  filter change) the section — slider *and* cards — was hidden regardless of this
  ticket. Fixed in `components/ListingPage/filterComponents/FiltersWindow/index.tsx`
  by adding a fallback to the aggregation's `prices.total`, which is populated
  **only when the flag is on**. The flag-off legacy path is therefore unchanged
  (rollback baseline identical to before). `FilterWidgetServer.tsx` (not in the
  plan's file list) was intentionally **not** touched to keep the rollback
  baseline faithful and avoid scope creep; forwarding `total_size` there is a
  recommended follow-up if the section should also show on initial render with
  the flag off.

> NOTE: the feature is gated **off by default** — `LISTING_PRICE_AGG_ENABLED=true`
> must be set in the environment (and the dev server restarted) to exercise the
> new path. With the flag off, the page-scan legacy behavior runs unchanged.

## Rework 2 — equal-count cards for skewed catalogs (2026-06-30)

Dev testing on `/sy-en/filters` (debug: 98 products, min 0.05, max 50000, 94 in
`[0.05, 2000]`) produced only **2** very wide cards. Root cause: the equal-WIDTH
histogram (25 buckets over a 50000 range ⇒ ~2000-wide buckets) collapsed the
dense region into one bucket, so cumulative-count card boundaries could only snap
to coarse bucket edges. Fixes in `services/elastic/helpers.ts`:

- `PRICE_HISTOGRAM_BUCKETS` 25 → **200** (finer resolution in the dense region).
- `deriveEqualCountCards` rewritten to place boundaries at the cumulative-count
  quantiles **interpolated within a bucket** (piecewise-uniform), with per-card
  counts allocated by overlap (`countInPriceRange`). Produces ~5 balanced,
  data-adaptive cards even under heavy skew; interior boundaries rounded to 2
  decimals; min/max kept exact; `n` capped to `min(cardCount, total)` for tiny
  result sets.

Known limitation (no-script/query-only): with an extreme outlier, the last card
can be wide (it absorbs the sparse high tail) and per-card balance is approximate
because boundaries inside a dominant bucket assume a uniform sub-distribution.
True percentiles would require a backend field (CON-1) or a runtime field
(rejected, ADR-010).

## Rework 3 — slider bounds must come from the facet, not the selection (2026-06-30)

Dev testing: after moving the slider, the track stayed clamped to the selection
("keeps its min/max", not widenable). Root cause (pre-existing prop wiring exposed
by self-exclusion): the slider `min`/`max` bounds were `filters.prices?.[n] ??
facet`, i.e. driven by the SELECTION. With the old page-scan the facet ≈ the
price-filtered products, so bounds ≈ selection and it looked fine; now that the
facet is self-excluding (full range), the selection-driven bounds collapsed the
track. Fix in `components/ListingPage/filterComponents/FiltersWindow/index.tsx`:
the slider `min`/`max` now read the facet bounds
(`FiltersNodes.prices.min_price/max_price`) so the track always spans the full
data range and stays widenable; the selection only positions the thumbs
(`initialMin`/`initialMax`). The chart already uses the full self-excluded
histogram, so slider and chart now agree. This realizes AC-7 (self-excluding,
widenable facet). No change to the self-exclusion decision.

## Rework 4 — cards drill down within the selected range (2026-06-30)

Product decision during testing: when a price range is selected, the clickable
**cards** should subdivide **within** that selection (drill-down), while the
**slider + curve** stay full-range/self-excluded (widenable). Implemented in
`services/elastic/elasticSearch.ts`:

- Extracted a local `runPriceHistogram(must, mustNot, lo, hi)` helper.
- Curve histogram: unchanged — full self-excluded range (aligns with the
  full-range slider).
- Cards: when a valid `filters.priceRange` selection exists, a second `size:0`
  histogram runs over the **main query conditions** (which include the price
  filter), bounded to the selection — so `deriveEqualCountCards` produces ~5
  balanced sub-range cards strictly inside the selection. With no selection, the
  cards derive from the full histogram as before.
- Debug log gains `cardsScopedToSelection`.

Behavior note / spec refinement: this is a deliberate asymmetry — slider/curve
self-excluded (AC-7, widenable), cards drill-down within the selection. Cards can
only narrow; widening is the slider's job. Cost: when a price is selected, the
filters fetch issues a third cheap `size:0` agg request (main + full-curve hist +
scoped-cards hist); the common no-selection load is unchanged (two requests).

## Rework 5 — re-scope the facet to the selection (reverses AC-7 self-exclusion) (2026-06-30)

Product-owner testing decision: the slider bounds, the curve, AND the cards
should all reflect the **current selection** (the price-filtered result set), not
a self-excluded full range. This matches the prior page-scan behavior. Change in
`services/elastic/elasticSearch.ts`:

- The `price_facet` stats agg and the histogram now use the **main query
  conditions** (`mustConditions` / `mustNotConditions`, which include the selected
  price filter) instead of the self-excluding non-price conditions. So
  `stats.min/max` (slider bounds), the histogram (curve), and the equal-count
  cards all re-scope to the selection.
- Removed the separate self-excluded curve histogram and the selection-scoped
  card histogram (rework 4): a single re-scoped histogram now feeds both curve and
  cards, so the filters fetch is back to two requests.
- The slider already reads its bounds from `FiltersNodes.prices.min/max`
  (rework 3), so with re-scoped stats the track now tracks the selection.

> **Spec impact (must reconcile at `/verify`):** this **supersedes AC-7** and the
> self-exclusion decision in ADR-010 (Decision §3). The facet is now
> *selection-reflecting* (re-scoping), not self-excluding. ADRs are append-only,
> so this is recorded here and should be reconciled via a spec note / follow-up
> ADR rather than rewriting ADR-010.
>
> **UX follow-up (not in this ticket's files):** with re-scoping the slider track
> collapses to the selection, so widening requires a **reset** control. The
> existing reset button (`FiltersWindow` `PriceCancel.svg`) is currently a no-op
> (its `resetPrice()` handler is commented out). Wiring it up is recommended so
> users can clear the price selection and return to the full range.

## Rework 6 — wire the price-only reset button (2026-06-30)

The price section's reset icon (`PriceCancel.svg`, previously a no-op) now clears
**only** the price selection (`setFilter({ ...filters, prices: [] })`), keeping
all other active filters. With re-scoping (rework 5), the debounced re-fetch then
recomputes the facet over the remaining filters, so the slider/curve/cards return
to the **active-filters range** (e.g. a category's full 10–3000), not the whole
catalog. Guarded by `loading`. Change confined to
`components/ListingPage/filterComponents/FiltersWindow/index.tsx`.

## Validation run during implementation

- `pnpm exec tsc --noEmit` — **exit 0** (no type errors; none in the changed
  files).
- `pnpm lint` — **0 errors** (24 pre-existing permissive warnings, none in the
  changed files).
- `git status` — diff confined to the three planned source files; no
  `serverRequests/**` or other unrelated changes (IM-4).
- Full `full-build` profile (typecheck + lint + production build) and the manual
  per-AC observational checks + rollback rehearsal are deferred to `/verify`
  (high_risk gate). The `LISTING_PRICE_AGG_DEBUG` logs are the verification lens
  for AC-1..AC-4 / AC-8 / AC-9.
