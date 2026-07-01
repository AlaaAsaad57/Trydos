# ADR 010: Global Elasticsearch aggregations for the listing price filter

- **Status:** accepted
- **Date:** 2026-06-30
- **Ticket:** price-filter-elastic-aggregations
- **Deciders:** Alaa (reviewer / approver 1), AlaaDev (approver 2), ai_agent (author)

## Context

The listing/search price filter derives its slider bounds, its clickable
price-range cards, the distribution curve, and the product count from only the
≤10 products on the **current page** (`calculatePriceRange` /
`calculatePriceFilter` over `response.hits.hits` in `services/elastic/*`). There
is **no price aggregation** in `buildAggregations`. Consequences: the slider
cannot reach the catalog's true min/max, a card can advertise a range that
contains zero (or far more) real matching products, and the count is the page
size, not the matching total.

The filter price must reflect the **country-aware offer price**, which is stored
in two indexed locations:

- `country_offer_prices` — **`nested`**, multi-entry; `country_offer_prices[C].offer_price`
  is the authoritative per-country price (precedence-1 in
  `resolveOfferPriceForCountry`).
- `offered_price` — root `double`; the base offer price for products without a
  per-country entry (falling back to `unit_price`).

**Hard constraints (from the ticket):**

- **C-1 — query-only:** no Go backend or ES index-mapping change.
- **C-2 — performance:** must not degrade listing/filter latency at ~100k active
  products, including an unscoped catalog browse.
- **C-3 — country-correct, multi-country:** a product may carry per-country
  prices for several countries at once.
- **C-4 — touches a protected path:** the filters response is consumed by
  `serverRequests/**`, making this `high_risk` and requiring a recorded decision
  (RV-6).

Two facts close the design space: (a) a Painless **runtime field cannot read the
nested** `country_offer_prices`, and the object `extra_price_for_country` flattens
and loses its `country_iso ↔ extra_price` pairing for multi-entry docs — so a
per-document computed effective price is **not** safely or cheaply scriptable at
100k; (b) the product owner confirmed every country-priced product **always** has
a `country_offer_prices[C]` entry (the additive-only case does not occur), so the
country price is always available from an **indexed** field.

A decision is needed because the candidate approaches differ sharply in
correctness and performance, and the change is `high_risk`.

## Decision

Compute the price facet from **global Elasticsearch aggregations over all
documents matching the active filters**, using **only indexed fields (no
scripts)**, and merge the two price populations in code:

1. **Filter price = country-aware offer price.** `country_offer_prices[C].offer_price`
   when present for the active country `C`, else `offered_price`, else
   `unit_price`. **Flashdeal and luck/redeem prices are excluded** from the filter
   price (a deliberate scope decision: shoppers filter by the offer price; the
   excluded prices are discounts that would otherwise require per-document,
   time/cookie-dependent precedence that is not cheaply aggregatable).
2. **Two-phase, two-population, no-script aggregation:**
   - **Stats phase** — merged `min`/`max`/`count` across **P1** (a `nested` agg
     over `country_offer_prices` filtered to `country_iso == C`, on `offer_price`)
     and **P3** (a root agg on `offered_price` for documents without a `C` entry)
     → slider bounds + total.
   - **Histogram phase** — one merged fine fixed-interval histogram
     (`min_doc_count: 1`, ~25 buckets) across P1 + P3, aligned and summed by
     bucket key → the distribution curve; ~5 **equal-count (quantile)** card
     boundaries and counts are derived from the cumulative distribution in code,
     dropping empty ranges. (A single `percentiles` agg cannot span two fields,
     so quantiles are computed from the merged histogram, not an agg.)
3. **Self-excluding facet.** The price aggregations are wrapped in a filter
   context that re-applies all active filters **except** the price range; the main
   query keeps the price filter, so the product grid and the other facets
   (brand/category/color/size) are unaffected.
4. **Consistent applied filter.** The existing `buildCountryAwarePriceRangeCondition`
   ranges the same nested-override + root-base space, so a card click returns
   exactly the products it counts.
5. **Base units.** Aggregations operate in base price units (as stored); display
   continues to convert via `RoundPrice(exchange_rate)`; a selected range filters
   in base units (no double conversion).
6. **Ship behind a runtime flag** `LISTING_PRICE_AGG_ENABLED` (off ⇒ exact current
   page-scan behavior), the primary rollback; the legacy helpers are retained
   behind the flag and removed in a post-bake-in follow-up.
7. **Debug-only verification logging** behind a separate dev-only flag
   `LISTING_PRICE_AGG_DEBUG` (off by default, hard-suppressed in production,
   confined to `services/elastic/*`) emits the per-population stats, merged bounds,
   histogram buckets, derived card boundaries/counts, total, and timing — the
   evidence lens for the manual acceptance checks (no automated test suite).

## Consequences

**Positive**

- True catalog-wide bounds, total, and live-only cards; every card maps to ≥1
  matching product, and card-click results are consistent with the counts.
- Country-correct and multi-country-correct via the nested field; honors C-1
  (query-only) and C-2 (all-indexed aggregations, no per-document scripting even
  on the unscoped browse).
- Self-excluding price facet (slider stays widenable) without disturbing other
  facets.
- Instant, deploy-free rollback via the runtime flag; verification made reliable
  by the gated debug logs.

**Negative / costs**

- The facet load is effectively **two aggregation phases** (stats → histogram,
  because the histogram interval needs min/max first) and a **code-side merge** of
  the two populations — more moving parts than a single agg.
- **Flashdeal/luck are intentionally excluded** from the filter price, so a deeply
  discounted product can fall outside the selected offer-price range relative to
  its displayed price (accepted, documented).
- Correctness depends on the data invariant "every country-priced product has a
  `country_offer_prices[C]` entry"; if violated, such a product falls back to its
  base `offered_price` in the facet (silent minor inaccuracy).
- Consumed by a **protected path** (`serverRequests/**`) → `high_risk` (2
  approvals, ADR, rollback rehearsal at `/verify`); the intent is to keep that
  file pass-through.
- No automated tests (CLAUDE.md) → correctness proven by a reproducible manual
  procedure aided by the debug logs + a rollback rehearsal.

## Alternatives considered

- **Painless runtime field computing a true per-document effective price.** Most
  faithful to the displayed price, but **cannot read the nested**
  `country_offer_prices`, mis-reads multi-entry `extra_price_for_country`, and
  scripts per-document at 100k (violates C-2/C-3). Rejected.
- **Backend-denormalized per-country effective-price field** indexed at write
  time — the textbook-correct, fastest option, but **violates C-1** (requires Go
  indexer + mapping changes). Rejected for this ticket; a candidate future
  optimization.
- **Indexed aggregations that also fold flashdeal/luck as price-floor minima.**
  Keeps everything indexed but only approximates per-document precedence and the
  additive country extra on discounts. Rejected in favor of the simpler, exact
  offer-price model after the decision to exclude flashdeal/luck.
- **Keep the page-scan but widen the page.** Fetching more documents to estimate
  bounds is still not catalog-wide, scales the wrong way, and never guarantees
  live-only cards. Rejected.

## References

- Ticket: `_specs/price-filter-elastic-aggregations/` (`research.md`, `spec.md`,
  `plan.md`).
- Related: [ADR-009](./ADR-009-elasticsearch-pit-listing-pagination.md) (the
  listing PIT/`search_after` path this change must stay compatible with);
  [ADR-003](./ADR-003-ticket-state-ownership.md) (ticket state ownership).
