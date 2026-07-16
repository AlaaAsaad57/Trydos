---
ticket: price-filter-elastic-aggregations
stage: intake
mode: high_risk
status: in_progress
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Intake — price-filter-elastic-aggregations

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

price-filter-elastic-aggregations — no external ClickUp/GitHub link yet.

## Ticket Summary

The listing/search price filter (slider bounds and the clickable price-range
cards) is currently derived from only the ≤10 products on the current page, not
from the full set of products that match the active filters. As a result the
slider cannot reach the catalog's true min/max, and price-range cards can show
ranges that have zero (or vastly more) real matching products. The request is to
recompute the price slider bounds, the price-range cards, and the total active
product count from global Elasticsearch aggregations over all matching documents,
so the slider reflects the true price range and every price card maps to at least
one live matching product — without degrading query performance at ~100k active
products.

## Ticket Metadata

- id / slug: price-filter-elastic-aggregations
- title: Listing/search price filter — global Elasticsearch aggregations for slider bounds & price-range cards (replace page-document scan)
- owner: ai_agent
- created: 2026-06-30
- links: (none yet)

## User Story

> As a shopper filtering a category/search listing, I want the price slider and
> price-range cards to reflect the true price range and product distribution of
> all products matching my current filters (not just the first page), so that the
> slider lets me reach any price and every price-range card I see returns at least
> one real product.

## Acceptance Criteria Presence Check

- Present? (no)
- Notes: Acceptance criteria are authored later at the `/spec` stage. Intake
  qualifies the request only. Direction agreed during brainstorming: price basis
  is the country-aware **offer price** (`country_offer_prices[C].offer_price`
  override, else `offered_price`/`unit_price`); flashdeal and luck prices are
  **excluded** from the filter price; bounds/cards/total come from global ES
  aggregations; the price facet **excludes its own** price filter; cards are
  **equal-count (quantile)** ranges derived from a merged fine histogram (which
  also feeds the density curve); empty cards are dropped.

## Test Cases Presence Check

- Present? (no)
- Notes: Test cases are authored at `/spec`. Repo policy is "no automated test
  suite" (CLAUDE.md); verification will be manual/observational against ES
  responses and the filters UI.

## Missing Information

- None blocking. Open implementation-level details to settle at `/plan`:
  1-pass vs 2-pass facet aggregation (stats → histogram), exact number of cards
  (≈5) and fine-histogram bucket count (≈25), and whether `serverRequests/**`
  (protected path) must be touched or can remain pure pass-through. The data
  shape was confirmed during brainstorming: both `country_offer_prices` (nested)
  and `extra_price_for_country` (object) exist, products can carry multiple
  country entries, and every country-priced product always has a
  `country_offer_prices` entry (so the additive-only "P2" case does not occur).

## Readiness Status

`READY`

- Justification: Request is well-qualified — clear problem (price slider/cards
  derived from ≤10 page docs instead of all matching docs), clear user story, and
  agreed direction from brainstorming. No blocking unknowns; remaining items are
  implementation-level and belong to `/plan`. Cleared to proceed to `/research`
  (RS-7).
