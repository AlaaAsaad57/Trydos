---
ticket: price-filter-elastic-aggregations
stage: research
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Research — price-filter-elastic-aggregations

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Compute the listing/search price slider bounds, the price-range cards, and the
total active-product count from **global Elasticsearch aggregations over all
documents matching the active filters**, instead of the current scan over the
≤10 products on the current page — so the slider reflects the true catalog price
range, every price card maps to ≥1 live matching product, and query performance
stays acceptable at ~100k active products.

## Relevant directories

- `services/elastic/` — the ES query/aggregation/response layer. Core of this
  ticket. Key files:
  - `services/elastic/elasticSearch.ts` — `getProductsAndFiltersFromElastic`
    assembles the query (`size: limit`, `aggs: buildAggregations(...)`),
    executes it, and shapes the response. `extractFilters` (≈815-853) calls the
    page-document price logic; `prices` is set from `productsWithFilters.prices`
    (≈352) and returned (≈589 / ≈408). `noProducts` is destructured (209) but
    currently unused.
  - `services/elastic/helpers.ts` — `buildAggregations` (≈1656, **no price
    aggregation today**), `buildBaseConditions` (≈896, applies the price filter
    at ≈997-1005), `buildCountryAwarePriceRangeCondition` (≈578, the applied
    range over `offered_price` + nested `country_offer_prices.offer_price`),
    `resolveOfferPriceForCountry`/`resolveUnitPriceForCountry` (≈494-576, the
    country-aware price), and the page-scan facet logic
    `calculatePriceRange` (≈824) / `calculatePriceFilter` (≈849) — to be
    replaced. `getSourceFields` (≈15-86), `processCustomProduct` (≈265-322).
- `serverRequests/listing/` — **PROTECTED PATH** (`serverRequests/**`).
  `index.tsx`: `GetFilters` (11, `noProducts:true`, `limit:10`, returns
  `prices: response.prices`, line 108), `GetProducts` (121), `GetNextPageFilters`
  (274) which renders the price cards from `response.prices.priceRanges`
  (≈376-390). Any edit here forces `high_risk` (MO-3) — design intent is to keep
  this a pure pass-through and do all shaping in `services/elastic/*`.
- `components/ListingPage/filterComponents/` — the filters UI.
  `FiltersWindow/index.tsx` feeds the slider bounds (≈345-370, incl. the
  `max → min_price` typo at 366) and the `SmoothPolygon` density chart
  (≈373-383); `PriceSliderComponent.tsx` is the dual-thumb slider;
  `PriceShape.tsx` is the density curve; `FilterItem.tsx` renders the clickable
  price cards (`term === "prices"`, ≈552-608).
- `components/ListingPage/` — `Product.tsx` (client card price precedence),
  `ProductInfiniteScroll.tsx`, `InfiniteScrollFilters.tsx` (consumers of the
  listing/filter responses).
- `store/listing/` and `store/search/` — Zustand slices. `listing` holds **no**
  price-filter state (panel uses local component state); `search` holds
  `searchFilters.prices` + `searchResults.prices/prices_ranges`.

## Relevant config files

- `es_cataloug_mapping.json` — ES index mapping. Confirmed field types:
  `offered_price` double (922), `unit_price` double (1029), `redeem_price` double
  (934), `flash_deal_price` long (896), `flash_deal_status` integer (899),
  `start_date`/`end_date` date (988/867); `country_offer_prices` **nested**
  (245-257: `country_iso` keyword, `extra_price` double, `offer_price` double);
  `extra_price_for_country` **object** (871-886: `country_iso` text+keyword,
  `extra_price` long). The nested vs object distinction is the central technical
  constraint (a root runtime-field script cannot read nested sub-docs; object
  arrays flatten and lose pairing).
- `package.json` — `@elastic/elasticsearch: "8"` (ES 8 → runtime fields,
  `histogram min_doc_count`, `variable_width_histogram` all available).
- `.claude/project-config.yaml` — `protected_paths` includes
  `serverRequests/**` (82) → MO-3 high_risk requirement; lifecycle/modes/closure.
- `CLAUDE.md` / `.github/copilot-instructions.md` — fetch patterns, store rules,
  breakpoints, "no automated tests" policy.
- `.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md` — PIT
  scoping already applied to listing search (the price aggs must remain
  compatible with the PIT/`search_after` path).

## Possibly affected services

- **Elasticsearch catalog search** (`services/elastic/*`) — primary impact: a new
  price-aggregation block added to `buildAggregations`, and the response-shaping
  in `getProductsAndFiltersFromElastic`/`extractFilters` changed to read bounds,
  cards, histogram, and total from aggregations rather than page hits. Must stay
  compatible with `search_after` + PIT (ADR-009) and the `noFilters`/`noProducts`
  flags.
- **Listing server requests** (`serverRequests/listing/index.tsx`, protected) —
  consumes `response.prices`; intended to remain pass-through. The price-cards
  render path (`GetNextPageFilters`) reads `priceRanges` — keeping that shape
  (`{min_price, max_price, products_count}`) avoids editing this protected file.
- **Filters UI** (`FiltersWindow`, `PriceSliderComponent`, `PriceShape`,
  `FilterItem`) — consumes the new `{min_price, max_price, priceRanges,
  histogram, total}` shape; slider bounds + density curve + cards.
- **Search slice flow** (`store/search`, `components/filterPage/*`) — a parallel
  price path; in scope only insofar as the response shape is shared. Listing
  panel price state is local component state, not the store.

## Test / validation commands available

(No automated test suite — CLAUDE.md. Commands below are listed, **not run**.)

- `pnpm lint` — ESLint (permissive config).
- `pnpm build` — production Next.js build / typecheck (catches TS + ES query
  type errors).
- `pnpm dev` / `pnpm turbo` — local dev server for manual UI verification of the
  slider bounds, density curve, and price cards.
- `pnpm knip` — unused files/exports (useful after deleting the page-scan
  helpers `calculatePriceRange`/`calculatePriceFilter`).
- `ANALYZE=true pnpm build` — bundle analysis (not expected to matter here).
- Manual/observational: inspect the raw ES `aggregations` in a query response and
  the `/filters`, category, and search listing pages across countries (e.g.
  `gb`, `tr`, `iq`) to confirm bounds/cards/total reflect all matching docs and
  every card returns ≥1 product on click.

## Risks and unknowns

- **Protected path (high blast radius).** `serverRequests/**` is protected;
  touching it triggers high_risk obligations (2 approvals, ADR, rollback
  rehearsal). Mitigation: keep `serverRequests/listing` as pass-through; confine
  changes to `services/elastic/*` + UI. To verify at `/plan` whether the cards
  render path truly needs no edit.
- **Two-population aggregation.** For a selected country the price lives in either
  the nested `country_offer_prices[C].offer_price` (override docs) or the root
  `offered_price` (base docs). Global stats/histogram must merge both populations
  (min-of-mins, max-of-maxes; histograms with shared interval/offset summed by
  key). A single `percentiles` agg cannot span both fields → equal-count cards are
  derived from the merged histogram's cumulative distribution client-side. Risk:
  bucket-key alignment and the histogram-interval-needs-min/max ordering (likely
  a 2-pass stats→histogram facet load).
- **Facet self-exclusion.** The price facet must exclude its own price filter but
  honor other active filters; requires a dedicated `filter` agg context
  (non-price musts + must_not) distinct from the main query. Risk of accidentally
  changing brand/category facet behavior — must be surgical and out of scope for
  other facets.
- **Performance at 100k.** Indexed nested + root aggregations are cheap, but must
  confirm cost on the unscoped `/filters` catalog-browse case and that the price
  aggs don't regress the existing brand/category aggregation timing. No scripts
  are planned (P2 additive-only case confirmed not to occur).
- **Currency/units.** Aggregations operate in base price units (as stored);
  display conversion stays in `RoundPrice(exchange_rate)`. Risk of double
  conversion if the selected range or bounds are converted twice — must keep the
  slider's internal values and the ES range filter in base units.
- **Flashdeal/luck exclusion.** Decision: flash and luck prices are excluded from
  the filter price. Risk that a heavily-discounted product appears outside the
  filtered range vs its displayed price — accepted by design; document clearly.
- **PIT / search_after compatibility (ADR-009).** New aggs must not break PIT
  snapshot search (a PIT search drops `index`). Aggregations are independent of
  `search_after`, but confirm the `noFilters` short-circuit (`delete
  searchQuery.aggs`) and `noProducts` (`size:0`) interactions.
- **Mapping assumption.** "Every country-priced product always has a
  `country_offer_prices` entry" (P2 never happens) is a data assertion from the
  product owner, not enforced by the index. If violated, additive-only docs would
  fall back to base `offered_price` in the facet (silent minor inaccuracy).

## Open questions

- Facet load: single combined aggregation request vs a 2-pass (stats → histogram)
  approach, given a histogram interval needs min/max first. Settle at `/plan`.
- Exact counts: number of price cards (~5) and fine-histogram bucket count (~25),
  and the card boundary rounding rule per currency.
- Can `serverRequests/listing/index.tsx` (`GetNextPageFilters` cards render) stay
  truly untouched, or is a shape change unavoidable (decides whether the
  protected-path/high_risk obligations are actually exercised)?
- Second approver + ADR ownership for the high_risk review gate — who, and which
  ADR records the aggregation-design decision.
- Should the `search` slice / search page price flow be aligned to the same new
  shape in this ticket, or tracked separately?

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
