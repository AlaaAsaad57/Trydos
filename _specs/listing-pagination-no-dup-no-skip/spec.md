---
ticket: listing-pagination-no-dup-no-skip
stage: spec
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Spec — listing-pagination-no-dup-no-skip

> Defines *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Stable, complete listing pagination (no duplicates, no skips).

## Business Goal

When a shopper browses a product listing and scrolls to load more, they
sometimes see the same product twice and may never see other products that match
their filters. This erodes trust ("is this store glitchy?"), wastes scroll
effort, and hides sellable inventory. The listing must show **every** matching
product **exactly once**, so shoppers can rely on what they see and reach all
available products.

## User Story

> As a shopper browsing a product listing, I want every product that matches my
> current filters to appear exactly once as I scroll, so that I can trust the
> list and discover all relevant products without seeing repeats or missing
> items.

## Functional Requirements

- FR-1 — Within a single browsing session for a fixed set of filters, each
  matching product appears **at most once** in the rendered list, no matter how
  many "load more" steps occur.
- FR-2 — Every product that matches the active filters is **reachable** by
  scrolling to the end; no matching product is silently omitted.
- FR-3 — Changing the filter set (add, remove, or replace any filter, including
  search text, price, category, brand, color, size, or boutique) starts a
  **fresh** result set. Products that match the new filters appear regardless of
  what was shown under the previous filters (no cross-filter suppression).
- FR-4 — "End of results" is reported correctly: the list stops requesting more
  only when all matching products have been shown — never prematurely, and never
  with a spinner that never resolves.
- FR-5 — The behavior in FR-1…FR-4 holds identically whether the page is opened
  by direct URL, by reload, or by in-app navigation, and across the filters,
  featured, flash-deals, and boutique listings.
- FR-6 — Product analytics emitted while browsing (the "items viewed in list"
  signal) reflects the **actually rendered** products: no event for a product the
  shopper never saw, and no duplicate event for a product shown once.
- FR-7 — The **related-products carousel** on the product page provides the same
  guarantee as the main listing: each related product appears at most once, every
  related product is reachable via "show more", and end is reported correctly.

## Non-Functional Requirements

- NFR-1 — The visible ordering of products within one filter session remains
  stable and coherent (a product does not jump position between page loads).
- NFR-2 — Scroll responsiveness is not visibly degraded; "load more" must not
  stall, hang, or spin indefinitely.
- NFR-3 — Any extra fetching introduced to guarantee correctness is **bounded**
  (a small, capped number of additional requests in the worst case), never an
  unbounded loop.
- NFR-4 — The solution is resilient to the catalog changing underneath an active
  browse (products added, removed, or re-indexed mid-scroll): it must still not
  duplicate or skip within the session.

## Constraints

- C-1 — **No search-index mapping change and no re-index.** The fix must work
  with the existing index structure and the existing product ordering.
- C-2 — The product ordering/relevance experienced by shoppers must not be
  redesigned (the listing stays relevance-ordered as today).
- C-3 — Operates within the existing runtime (storefront SSR + server "load
  more" + search backend); no new infrastructure.
- C-4 — The change touches a protected server path, so it runs under the
  high-risk track (two approvals, an architectural decision record, and a
  rollback rehearsal before close).
- C-5 — Correctness must be demonstrable by a **reproducible manual procedure**
  (the project has no automated test suite).

## Edge Cases

- EC-1 — An entire freshly fetched page consists only of products already shown
  (must add nothing and must not stall — continue or correctly end).
- EC-2 — The catalog is refreshed/modified between two "load more" steps.
- EC-3 — The search backend serves two requests from copies whose relevance
  scoring differs slightly (the classic duplicate/skip trigger).
- EC-4 — The filter set changes while a "load more" request is still in flight.
- EC-5 — The result set is empty or smaller than one page.
- EC-6 — A long browsing session outlives the consistency window/snapshot used to
  guarantee stability (must transparently resume from a fresh snapshot at the last
  position and continue — never end early, never duplicate, never crash; see
  OQ-1 decision).
- EC-7 — The shopper toggles a filter on and then immediately back off (returns
  to a result set equivalent to before) — still no duplicates or skips.

## Resolved Decisions

- OQ-1 — **Resolved (safest).** On consistency-window expiry mid-browse, the list
  **transparently resumes from a fresh snapshot at the last position and
  continues** — it does **not** end early. The render-time id-dedupe guarantees no
  duplicate across the re-open boundary, so continuing preserves completeness (all
  matching products stay reachable). "Treat as end-of-list" was rejected because
  it would hide remaining matching products — a skip, the exact failure this
  ticket removes.
- OQ-2 — **Resolved: yes.** The no-duplicate/no-skip guarantee **extends to the
  related-products carousel** on the product page; it shares the same
  page-by-cursor mechanism and exhibits the same two defects. Now in scope
  (FR-7 / AC-14).

## Acceptance Criteria Mapping

> Each criterion has a stable ID; `verify.md` references these (TR-1/TR-2).

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | Scrolling a listing to its end under a fixed filter set renders no product id more than once. | FR-1 |
| AC-2  | The count of distinct products rendered when scrolled to the end equals the total number of products matching the filters (no skips). | FR-2 |
| AC-3  | After changing the filter set, products matching the new filters render even if they were shown (or hidden) under the previous filters; the new set has no duplicates. | FR-3 |
| AC-4  | The list reports "end of results" only when all matching products are shown — no premature stop and no never-ending spinner. | FR-4, NFR-2 |
| AC-5  | AC-1…AC-4 hold on direct URL load, on reload, and on in-app navigation, across filters, featured, flash-deals, and boutique listings. | FR-5 |
| AC-6  | The "items viewed in list" analytics matches the rendered products exactly (no phantom or duplicate entries). | FR-6 |
| AC-7  | A fully-already-seen page adds nothing and the list neither stalls nor ends incorrectly. | EC-1, NFR-2 |
| AC-8  | With the catalog mutated between page loads (and/or scoring divergence between requests), the session still shows no duplicates and no skips. | NFR-4, EC-2, EC-3 |
| AC-9  | Worst-case extra fetching to guarantee correctness is bounded by a fixed cap (no unbounded loop). | NFR-3 |
| AC-10 | Visible product ordering within a filter session is stable across "load more" steps. | NFR-1 |
| AC-11 | When the consistency window expires mid-browse, the list transparently resumes from a fresh snapshot at the last position and continues — no early end, no duplicate, no crash (OQ-1). | EC-6 |
| AC-12 | No search-index mapping change and no re-index is required to ship the fix. | C-1 |
| AC-13 | The protected-path change is delivered under the high-risk track: two approvals, an ADR, and a rollback rehearsal recorded before close. | C-4 |
| AC-14 | The product-page related-products carousel shows each related product at most once, makes every related product reachable via "show more", and reports end correctly. | FR-7 |

## Out of Scope

- Any redesign of relevance ranking or sort order (C-2).
- The currency/`NaN` price defect (already fixed and shipped on `develop`).
- Re-indexing, mapping changes, or new search infrastructure.
