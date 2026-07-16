---
ticket: price-filter-elastic-aggregations
stage: review
mode: high_risk
status: complete
owner: reviewer
updated: 2026-06-30
links:
  clickup:
  github:
---

# Review — price-filter-elastic-aggregations

> Review gate. The reviewer evaluates the spec and plan before any implementation.

## Review Scope

Reviewed `spec.md` (13 acceptance criteria AC-1..AC-13), `plan.md` (approach,
steps, files to change, validation strategy, rollback), and the supporting
`research.md`, against the `high_risk` gate requirements. Also reviewed the
design decision recorded in `ADR-010-price-filter-aggregations`.

## Plan Summary

Replace the current-page price scan with global Elasticsearch aggregations so the
slider bounds, the price-range cards, the distribution curve, and the total
reflect all products matching the active filters. The filter price is the
country-aware offer price (nested `country_offer_prices[C].offer_price` override,
else root `offered_price`, else `unit_price`); flashdeal and luck/redeem prices
are excluded. A two-phase, two-population, no-script aggregation (stats →
histogram, merged in code) yields true bounds/total and equal-count, live-only
cards; the price facet self-excludes its own range while honoring other filters.
Shipped behind `LISTING_PRICE_AGG_ENABLED` (instant flag rollback) with dev-only
debug logging behind `LISTING_PRICE_AGG_DEBUG` for verification.

## Risks

- Protected path `serverRequests/**` may be touched; intent is pass-through only.
  Any change there is the protected-path impact to record at `/verify` (VF-9/TR-3).
- Two-phase facet load + code-side two-population merge add complexity; histogram
  interval depends on min/max ordering.
- Correctness depends on the data invariant "every country-priced product has a
  `country_offer_prices[C]` entry"; violation causes a silent fallback to base
  `offered_price`.
- Flashdeal/luck exclusion means a deeply discounted product can fall outside the
  selected offer-price range vs its displayed price (accepted, documented).
- Performance must be confirmed on the unscoped `/filters` browse at ~100k.

## Assumptions

- The additive-only country case (`extra_price_for_country` without a
  `country_offer_prices` entry) does not occur (product-owner confirmed).
- ES 8 features (nested aggs, `histogram min_doc_count`) are available.
- The existing applied range condition already ranges the same nested+root price
  space, keeping card-click results consistent.

## Open Questions

- Final card count (~5) and per-currency boundary labeling — to confirm during
  implementation/verify; not blocking approval.
- Whether the separate search-page price flow is aligned now or in a follow-up —
  tracked as out of scope unless decided otherwise.

## Decision

`APPROVED`

- Rationale: Safe, query-only approach that fixes the price slider and
  price-filter cards to reflect all matching products instead of the current-page
  products, with correct country pricing, no per-document scripting at 100k, a
  flag-gated rollback, and dev-only verification logging. Plan satisfies
  PL-1..PL-5 with traceability to AC-1..AC-13 (RV-3). High-risk obligations met:
  two distinct approvers (RV-5) and ADR-010 recorded (RV-6).

## Approvals

> `standard` requires 1 approver. `high_risk` requires 2.

- Approver 1 (reviewer): Alaa
- Approver 2 (high_risk only): AlaaDev

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: ADR-010 (`.claude/docs/adr/ADR-010-price-filter-aggregations.md`)

## Required Follow-up Actions

- none (cleared to `/implement`). Confirm the final card count and per-currency
  boundary labeling during implementation; record the `serverRequests/**`
  protected-path impact (yes/no) at `/verify`.
