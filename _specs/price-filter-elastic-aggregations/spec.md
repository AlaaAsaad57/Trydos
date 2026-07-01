---
ticket: price-filter-elastic-aggregations
stage: spec
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Spec — price-filter-elastic-aggregations

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Catalog-wide price filter — slider bounds, price-range cards, and total count
computed over all matching products.

## Business Goal

The price filter is a primary way shoppers narrow a listing. Today its slider
range, its price-range cards, and the product count are derived from only the
products on the current page, so the slider cannot reach the catalog's true
price range and cards can advertise ranges that contain no real matching
products (or a misleading count). This erodes trust in the filter and hides
products from buyers. Making the price filter reflect the full set of matching
products — accurately and at scale — improves discoverability, conversion, and
confidence in the storefront.

## User Story

> As a shopper filtering a category, search, or browse listing, I want the price
> slider and the price-range cards to reflect the true price range and product
> distribution of **all** products matching my current filters (not just the
> first page), so that I can reach any price and every price-range card I see
> returns at least one real product.

## Functional Requirements

- **FR-1 — True bounds.** The price slider's minimum and maximum reflect the
  lowest and highest filterable price across **all** products matching the
  currently-active filters, not just the products on the current page.
- **FR-2 — True total.** The product count associated with the filter reflects
  the total number of matching active products, not the current page size.
- **FR-3 — Live cards only.** Every price-range card shown corresponds to **at
  least one** live product matching the current filters; ranges with zero
  matching products are not displayed, and each card's count reflects the full
  matching set.
- **FR-4 — Balanced cards.** Price-range cards divide the price range so that
  each card holds approximately the same number of matching products (a balanced,
  count-based division rather than fixed equal-width slices).
- **FR-5 — Filter price definition.** The price used for the slider, the cards,
  the total, and the applied filter is the **country-aware offer price**: the
  country-specific offer price when one exists for the active country, otherwise
  the base offer price, falling back to the regular price when no offer exists.
  **Flashdeal and luck/redeem prices are excluded** from the filter price.
- **FR-6 — Selection consistency.** When the shopper selects a price range (by
  moving the slider or tapping a card), the returned products are exactly those
  whose country-aware offer price (FR-5) falls within the selected range — so
  tapping any displayed card always returns products, consistent with its count.
- **FR-7 — Self-excluding facet.** The price slider bounds and the cards reflect
  all other active filters (category, brand, color, size, country) but **exclude
  the shopper's own currently-selected price range**, so the slider can always be
  widened again after a selection.
- **FR-8 — Distribution visualization.** The price-distribution curve shown in
  the filter panel reflects the full matching set at a finer granularity than the
  clickable cards.
- **FR-9 — Country correctness.** For a given active country, the filter price
  honors that country's pricing, including products priced differently per
  country and products carrying no country-specific price.

## Non-Functional Requirements

- **NFR-1 — Performance at scale.** With on the order of 100,000 active products,
  computing the bounds, cards, total, and distribution must not materially
  degrade listing/filter response time, including on an unscoped catalog browse.
- **NFR-2 — Currency fidelity.** Prices are compared and filtered in the
  catalog's base price units; displayed values continue to use the active
  country's currency and decimal formatting. A range the shopper selects filters
  in the same units it is presented in (no double conversion, no min/max
  mismatch).
- **NFR-3 — No facet regressions.** Other filters (brand, category, color, size)
  retain their current counts and behavior.
- **NFR-4 — Pagination compatibility.** The change preserves existing listing
  pagination and snapshot behavior.

## Constraints

- **CON-1 — Query-only.** No backend service or search-index mapping changes;
  the solution works within the existing data and query surface.
- **CON-2 — High-risk gate.** This work runs in `high_risk` mode: any change to a
  protected runtime path requires the high_risk review gate (two approvals, a
  recorded ADR, and a rollback rehearsal at verification). Protected-path
  exposure should be minimized.
- **CON-3 — No automated tests.** The repository has no automated test suite;
  acceptance is verified manually/observationally.
- **CON-4 — Data assumption.** Every country-priced product carries a
  country-specific pricing entry for that country (the "additive extra without a
  country price entry" case does not occur); if violated, such a product falls
  back to its base offer price in the filter.

## Edge Cases

- All matching products share a single price → slider minimum equals maximum;
  cards collapse to a single card or none; nothing renders as `NaN` or crashes.
- Zero matching products → no bounds, no cards, total of 0, handled gracefully.
- No active country / default country → the base offer price applies uniformly.
- A product has an offer price but no regular price (or vice versa) → a sensible
  fallback price is used; never `NaN`.
- A country for which no product has country-specific pricing → base offer price
  for all.
- A heavily discounted product (flashdeal/luck) may fall outside the selected
  offer-price range relative to its displayed discounted price — accepted by
  design (FR-5) and to be clearly documented.
- Currencies with zero or multiple decimal digits → bounds and card labels
  respect the currency's decimal configuration.

## Open Questions

- Confirm the target number of price-range cards (around five) and the labeling
  rule for card boundaries per currency.
- Whether the parallel search-page price flow should be aligned to the same
  behavior within this ticket or tracked as a separate ticket.
- Confirmation of the second approver and the ADR that will record the design
  decision (required by the high_risk gate).

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | On a listing with more matching products than fit on one page, the price slider's min and max equal the lowest and highest country-aware offer price across the entire matching set (verified against the known catalog extremes), not the current page. | FR-1, FR-9 |
| AC-2  | The total product count presented with the filter equals the total number of matching active products, independent of page size. | FR-2 |
| AC-3  | Every price-range card displayed maps to ≥1 matching product; no empty card is shown, and each card's count matches the number of matching products in its range. | FR-3 |
| AC-4  | Across a skewed price distribution, the cards hold approximately equal product counts rather than equal price widths. | FR-4 |
| AC-5  | The slider/cards/total/applied filter all use the country-aware offer price; flashdeal and luck/redeem prices do not change the filter price. | FR-5 |
| AC-6  | Tapping any displayed price card returns a non-empty result set whose size is consistent with the card's stated count, and selecting a slider range returns exactly the products whose country-aware offer price is within that range. | FR-6 |
| AC-7  | After selecting a price sub-range, the slider bounds and cards still reflect the full price range available under the other active filters (the selection can be widened); changing a non-price filter (e.g. category) updates bounds and cards accordingly. | FR-7 |
| AC-8  | The price-distribution curve reflects the full matching set at finer granularity than the cards. | FR-8 |
| AC-9  | For two countries with different pricing for the same products, the bounds, cards, and applied filter differ correctly per country; products with no country-specific price use the base offer price. | FR-9 |
| AC-10 | On a listing of roughly 100k active products (including an unscoped browse), filter responses return within an acceptable latency budget with no full-catalog per-product scripting, and brand/category/color/size facet counts are unchanged. | NFR-1, NFR-3 |
| AC-11 | Bounds and card labels display in the active country's currency and decimal precision, and a selected range filters consistently with the displayed values (no double conversion). | NFR-2 |
| AC-12 | Existing listing pagination/snapshot behavior is unchanged after the modification. | NFR-4 |
| AC-13 | Boundary inputs (single shared price, zero matches, missing offer/regular price, currency decimal variations) render without `NaN`, empty-card artifacts, or crashes. | FR-3, NFR-2 (edge cases) |

## Out of Scope

- Including flashdeal or luck/redeem prices in the filter price (explicitly
  excluded by FR-5).
- Any backend service or search-index mapping change (CON-1).
- Re-working other filters (brand, category, color, size) beyond preserving their
  current behavior.
- Aligning the separate search-page price flow, unless decided otherwise via the
  corresponding open question.
- Visual/redesign changes to the filter panel beyond what these requirements
  imply.
