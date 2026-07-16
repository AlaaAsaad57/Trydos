---
ticket: price-filter-elastic-aggregations
stage: plan
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Plan — price-filter-elastic-aggregations

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Replace the current-page price scan with **global Elasticsearch aggregations** so
the slider bounds, the price-range cards, the distribution curve, and the total
count all reflect every product matching the active filters. The filter price is
the **country-aware offer price** (the nested per-country `offer_price` override
when present for the active country, else root `offered_price`, else
`unit_price`); flashdeal and luck/redeem prices are excluded (AC-5). Because a
selected country's price lives in **two** indexed locations — nested
`country_offer_prices.offer_price` for override products and root `offered_price`
for the rest — and a single percentiles agg cannot span two fields, we use a
**two-phase, all-indexed (no scripts)** facet computation and merge the two
populations in code:

1. **Stats phase** — merged `min`/`max`/`count` across both populations → slider
   bounds (AC-1) and total (AC-2).
2. **Histogram phase** — one merged fine fixed-interval histogram (~25 buckets,
   `min_doc_count: 1`) across both populations → the distribution curve (AC-8);
   the ~5 **equal-count (quantile)** card boundaries and counts are derived from
   the histogram's cumulative distribution in code (AC-3, AC-4), dropping empty
   ranges.

The price facet aggregations are wrapped in a filter context that re-applies all
active filters **except** the price range (self-exclusion, AC-7); the main query
keeps the price filter so the product grid and other facets are unaffected
(AC-10/NFR-3). The already-correct applied range condition (which ranges the same
nested-override + root-base space) is reused so a card click returns exactly its
products (AC-6). Chosen over a Painless runtime field (which cannot read the
nested override and would script per-document at 100k — rejected on correctness
**and** NFR-1) and over a backend-denormalized field (rejected by CON-1). This
design decision is recorded in a new ADR (high_risk, RV-6).

**Rollout safety:** the new aggregation path is gated behind a config flag (env,
mirroring the `LISTING_PIT_ENABLED` pattern). When off, the existing page-scan
path runs unchanged — giving an instant, deploy-free rollback (see Rollback).
The legacy page-scan helpers are therefore **retained behind the flag** for this
ticket and removed in a follow-up after bake-in (so `knip` will not flag them).

**Debug-only verification logging:** to make the manual/observational acceptance
checks (CON-3) reliable, the new path emits **structured debug logs gated behind
a separate dev-only flag** `LISTING_PRICE_AGG_DEBUG` (off by default; also
suppressed when `NODE_ENV === "production"`, so it can never log in prod). The
logs live **only** in the non-protected `services/elastic/*` layer — never in
`serverRequests/**` — and contain no tokens/PII. They expose exactly what the
reviewer needs to confirm the work is clean and correct: per-country/per-filter
context, the two populations' raw stats, the merged bounds, the histogram
buckets, the derived card boundaries + counts, the total, and timing. They are a
verification aid, not product behavior — see Validation strategy and Out of
scope.

## Steps

1. **Add a config flag** `LISTING_PRICE_AGG_ENABLED` (read in the elastic
   service) defaulting off, to gate the new path.
2. **Factor the price condition out** of the base-condition builder so the
   non-price `must`/`must_not` set is available to build the self-excluding facet
   filter context (no behavior change to the main query when flag off).
3. **Add price aggregation builders** (stats phase + histogram phase) producing,
   for the active country: a nested aggregation over `country_offer_prices`
   filtered to the country on `offer_price`, plus a root aggregation on
   `offered_price` for documents without a country entry — both wrapped in the
   non-price filter context.
4. **Add a merge/derive helper** that combines the two populations' stats
   (min-of-mins, max-of-maxes, summed count), aligns and sums the two histograms
   by bucket key, and derives ~5 equal-count card boundaries + counts from the
   cumulative distribution, dropping empty ranges. Output the
   `{ min_price, max_price, priceRanges, histogram, total }` shape in base price
   units.
5. **Wire the elastic search function** so that, when the flag is on and filters
   are needed (`noProducts` path), it runs the two aggregation phases (set
   `size: 0` to honor `noProducts`), builds the price shape from aggregation
   results instead of the page-scan, and stays compatible with PIT/`search_after`
   (ADR-009) and the `noFilters` short-circuit.
6. **Add debug-only verification logging** in the `services/elastic/*` layer,
   gated behind `LISTING_PRICE_AGG_DEBUG` (off by default; hard-suppressed in
   production). Emit one structured entry per facet computation containing: the
   active country and the non-price filter context used for self-exclusion; each
   population's raw stats (count, min, max) and the merged bounds; the histogram
   bucket keys/counts; the derived equal-count card boundaries + per-card counts;
   the total; and timing (ES `took` + server compute ms). No tokens/PII; never in
   `serverRequests/**`.
7. **Update the filters UI** to feed slider bounds, the distribution curve (finer
   histogram), and the cards from the new shape, and use the true total; fix the
   slider `max` fallback that currently points at `min_price`.
8. **Verify the cards render path stays pass-through** (the card item shape
   `{ min_price, max_price, products_count }` is preserved); touch the protected
   `serverRequests/listing` file **only** if a shape change is unavoidable.
9. **Author the ADR** capturing the two-population, no-script aggregation design
   and the flash/luck-exclusion decision (recorded at the `/review` gate, RV-6).
10. **Validate** per the strategy below (profile + manual/observational per AC,
    aided by the debug logs), including a rollback rehearsal (flag flip) for the
    high_risk gate.

## Files to change

- `services/elastic/helpers.ts` *(not protected)* — add the price aggregation
  builders (stats + histogram phases, nested + root, self-excluding filter
  context), the two-population merge/derive helper (bounds, equal-count cards,
  histogram), and factor the price condition out of the base-condition builder.
  Retain `calculatePriceRange`/`calculatePriceFilter` behind the flag.
- `services/elastic/elasticSearch.ts` *(not protected)* — gate on the flag; in
  the filters path run the two aggregation phases, set `size: 0` for `noProducts`,
  build the `{min_price, max_price, priceRanges, histogram, total}` shape from
  aggregations; preserve PIT/`search_after`/`noFilters` behavior.
- `components/ListingPage/filterComponents/FiltersWindow/index.tsx`
  *(not protected)* — slider bounds + total from the new shape; curve from the
  finer histogram; cards from equal-count `priceRanges`; fix the `max → min_price`
  fallback.
- `components/ListingPage/filterComponents/PriceShape.tsx` *(not protected)* —
  accept the finer histogram input for the density curve.
- `components/ListingPage/FilterItem.tsx` *(not protected)* — price-card branch;
  expected unchanged (shape preserved) — touch only if the card data shape
  changes.
- `serverRequests/listing/index.tsx` **(PROTECTED — `serverRequests/**`)** —
  intended **pass-through, no change**; the new fields flow through
  `prices: response.prices` and the preserved card shape. Listed because, under
  `high_risk`, an edit here is permitted **only if** the cards render path
  (`GetNextPageFilters`) provably needs the new shape; any such change is the
  protected-path impact to record at `/verify` (VF-9/TR-3).
- `.claude/docs/adr/ADR-0XX-price-filter-aggregations.md` *(workflow doc, not
  source)* — new ADR for the design decision (created at the `/review` gate).
- Config/env for `LISTING_PRICE_AGG_ENABLED` (path gate) and
  `LISTING_PRICE_AGG_DEBUG` (dev-only verification logging; off by default,
  hard-suppressed in production) — documented; consistent with the existing
  listing flag pattern. Debug-log emission is confined to `services/elastic/*`.

## Validation strategy

- Validation profile: `full-build`   *(typecheck + lint + production build with
  rollback depth — matches high_risk/protected-path work; VP-1/VP-4 satisfied —
  commands live in `validation_checks`, not here).*
- **Debug logs as the verification lens:** enable `LISTING_PRICE_AGG_DEBUG` in
  development and cross-check each logged value (per-population stats, merged
  bounds, histogram buckets, card boundaries + counts, total) against the
  rendered slider/cards/curve and against known catalog values — this is the
  primary evidence for AC-1..AC-4, AC-8, AC-9. Confirm the logs never emit with
  the flag off or in production.
- Manual/observational (no automated suite — CON-3), one check per AC:
  - Inspect the raw ES `aggregations` and compare slider min/max to known catalog
    extremes on a multi-page listing (AC-1); confirm total = matching docs (AC-2).
  - Confirm every rendered card has ≥1 product and counts match; no empty cards
    (AC-3); confirm balanced (equal-count) distribution on a skewed listing (AC-4).
  - Confirm flash/luck do not move the filter price (AC-5); tapping each card and
    moving the slider returns the expected, consistent result set (AC-6).
  - After selecting a sub-range, confirm bounds/cards still show the full range
    and react to non-price filter changes (AC-7); confirm the finer curve (AC-8).
  - Compare two countries with different pricing + a no-country-price product
    (AC-9); confirm brand/category/color/size counts unchanged and response
    latency acceptable at ~100k incl. unscoped browse (AC-10/NFR-1/NFR-3).
  - Confirm currency/decimal display and no double conversion (AC-11); confirm
    pagination/snapshot unchanged (AC-12); confirm edge cases render without NaN
    or empty-card artifacts (AC-13).
- **Rollback rehearsal (high_risk depth):** with the change in place, flip
  `LISTING_PRICE_AGG_ENABLED` off and confirm the listing returns to the prior
  page-scan behavior with no errors — recorded at `/verify`.

## Rollback

- **Primary:** set `LISTING_PRICE_AGG_ENABLED` off — instant, deploy-free revert
  to the retained page-scan path (the rehearsed mechanism above).
- **Secondary:** the implementation lives on the `ticket/price-filter-elastic-aggregations`
  branch with no commit until delivery; discard the branch / working-tree changes
  to abandon. Post-merge, revert the PR — the change is additive to the query/UI
  layer, so reverting restores prior behavior, including the retained helpers.

## Out of scope

- Including flashdeal or luck/redeem prices in the filter price (excluded, FR-5).
- Any backend service or search-index mapping change (CON-1).
- Changing other facets' (brand/category/color/size) behavior beyond preserving
  it.
- Aligning the separate search-page price flow (tracked separately unless the
  spec open question decides otherwise).
- Deleting the legacy page-scan helpers (deferred to a post-bake-in follow-up).
- Visual redesign of the filter panel beyond what these requirements imply.
- Any production logging: the debug logs are dev-only, flag-gated, and
  hard-suppressed in production; they add no runtime behavior and emit no
  tokens/PII. (Whether to keep them gated long-term or strip them is a
  post-bake-in decision, not part of this ticket's product behavior.)
