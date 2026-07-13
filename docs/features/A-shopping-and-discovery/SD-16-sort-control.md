# SD-16 — Sort Control

| | |
|---|---|
| **Feature ID** | SD-16 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Listing/ListingSortControl.tsx`, `services/elastic/sortKeys.ts`, `services/elastic/helpers.ts`, `components/Server/SortableGrid.tsx` |

---

## What it is

The control that lets a shopper **reorder a listing** — by relevance, best sellers, newest,
price, or name. It opens as a bottom sheet from the sort icon.

## Where it appears

In the filter bar of every listing page (SD-14): the filters/category/boutique/search pages,
the Featured page and the Flash-Deals page.

## Who uses it

Shoppers who want results in a particular order (cheapest first, newest first, etc.).

## How it works (verified behaviour)

- **Five choices** are offered, two of them with a direction toggle:
  - **Default** (relevance)
  - **Best sellers**
  - **New arrivals** — Newest / Oldest
  - **Price** — Low to High / High to Low
  - **Name** — A to Z / Z to A
- **Select, then confirm.** Tapping a choice only *stages* it; nothing changes until the
  shopper taps the **Confirm** button at the bottom of the sheet. A **Reset** button returns to
  Default. (This "confirm" step mirrors the filter panel and is recent UX work.)
- **Applied via the URL.** Confirming writes `?sort=<key>` to the page URL (or removes it for
  Default), so a sorted listing is a shareable link.
- **Re-sorts without a full reload.** Because the page's cached server render doesn't vary by
  the sort parameter on its own, a small client wrapper (`SortableGrid`) detects the new
  `?sort=` and re-fetches the grid from page 1 in place — the shopper sees the re-sorted list
  without a hard page reload.
- **Brand accent `#FF6464`.** The active choice, the check mark, the "sorted" dot on the icon
  and the Confirm button all use this pink accent (a recent restyle).

## Data source

| Item | Value |
|------|-------|
| Sort vocabulary | `services/elastic/sortKeys.ts` → `LISTING_SORT_KEYS` (client-safe list) |
| Applied by | `?sort=<key>` in the page URL, read by the listing routes and passed to Elasticsearch |
| Server re-sort | listing routes thread `sort` into `getProductsAndFiltersFromElastic({ sort })` |
| Client re-sort | `components/Server/SortableGrid.tsx` remounts the scroller keyed by the sort |
| Key → engine | `buildSortClause()` in `services/elastic/helpers.ts` |

## Technical reference

| Item | Value |
|------|-------|
| Sort widget | `components/Listing/ListingSortControl.tsx` (opens a `BottomSheet`) |
| The 7 keys | `best_selling, newest, oldest, price_asc, price_desc, name_asc, name_desc` (+ implicit `relevance`) |
| Engine mapping | best_selling→`orders_count`; newest/oldest→`created_at`; price→root `offered_price`; name→`custom_products.name.keyword`; default→`_score` |
| Stable ordering | every sort appends a tie-breaker on `id` (needed for cursor pagination) |
| Accent colour | `PRIMARY = "#FF6464"` |
| Confirm / Reset | `data-cy="sort_confirm"` / `data-cy="sort_clear"` |

## Current status & maturity

**Live and stable**, and recently reworked (select-then-confirm flow + the `#FF6464` accent).

## Known gaps / notes

- **Price sort uses the base `offered_price` only** and, by design, ignores per-country price
  overrides — a **confirmed, locked decision (kept as-is)**, not a bug. When a country override
  applies, the price shown on the card (country-accurate) can differ from the product's sort
  position (ordered by base price): e.g. for `country=sy` a product whose base offer is `8` but
  SY offer is `28` still sorts at `8`. Note the price **filter** and **facet** _are_ already
  country-accurate — sort is the one operation that can't reuse that approach, because a filter
  is a boolean match but a sort needs a single per-product ordering value that ES can't derive
  from the per-country override + base price together. Making sort country-accurate would need
  either a slow per-request price computation or a new backend-indexed price field; both were
  weighed and **deliberately deferred**. See the sort design spec and `ADR-010` for the full
  rationale.
- **Name sort is raw byte order**, not true language-aware alphabetical ordering — noted as
  deferred in the code.

## Related features

SD-14 (Listing page it reorders) · SD-15 (Filter panel, same bar) · SD-12 (In-search filtering).
