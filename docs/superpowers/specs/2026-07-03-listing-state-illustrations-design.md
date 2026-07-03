# Listing state illustrations — Design

**Date:** 2026-07-03
**Branch:** `ticket/listing-refactor`
**Concept board:** https://claude.ai/code/artifact/386f5e16-6751-4418-be43-37252cf061ff
**Scope:** the listing "reached end" and "no products found" states.

## Problem

Two listing states are currently bare or missing:

1. **Reached end** — when the infinite scroll runs out, the bottom of the grid
   shows plain muted text `translate("Reach End")`
   (`components/ListingPage/ProductInfiniteScroll.tsx:320`). No graphic; the copy
   (`"Reach End"`) is also grammatically off.
2. **No products found** — there is **no** empty state today. When a search/filter
   returns zero results, `ProductListServer` renders an empty grid (plus a bare
   "Reach End"). This state is **net-new**.

We want an on-brand vector illustration for each, forming one matched family, fully
translated, and wired into the listing pages.

## Chosen direction — "Red-bag hero" (Direction A)

Both states share the app's signature **red shopping-bag** motif (`#f85555`),
softly filled, differentiated only by a small status badge — a symmetry that reads
instantly:

- **Reached end** — filled red bag + **✓ badge** + two small sparkles.
- **No products found** — outline (empty) red bag + **🔍 badge**.

Rationale: the red bag is the established brand signature (design-language §8), and
an end/empty state is a legitimate brand moment. Directions B (soft monoline) and C
(product-card metaphor) were considered on the concept board and set aside.

## Copy (new translation keys)

Copy renders through `translateFunction` (never baked into the SVG) so it stays
translatable and RTL-correct. Keys are the English strings; English falls back to
the key, so only `ar` / `tr` / `ku` get entries.

| Key (English) | Where |
|---|---|
| `You've reached the end` | reached-end heading |
| `You've seen everything in this list.` | reached-end subline |
| `No products found` | empty heading |
| `Try changing or clearing your filters.` | empty subline |
| `Clear filters` | empty CTA (only when real filters applied — see visibility rule) |

The obsolete `"Reach End"` key stays in the translation files (harmless) but is no
longer referenced.

## Components

### 1. Illustrations — shared, pure-SVG (no directives)

A single module `components/Listing/illustrations/ListingBagIllustration.tsx`
exports two pure-SVG components — `<BagReachedEnd />` and `<BagNoResults />` — each
a self-contained `<svg viewBox="0 0 160 160">` (~1–2 KB). No `"use client"`, no
server-only imports, so the same component renders in **both** the client
infinite-scroll and the server empty state. Colors are the app's fixed hexes (brand
red `#f85555`, soft tint `#fff0f1`, muted line `~#d9d9de`, badge cut-out matched to
the listing surface `#f4f4f4`) — the storefront is light-only, so no theme tokens.

### 2. Reached-end — swap in `ProductInfiniteScroll.tsx` (client)

Replace the `{translate("Reach End")}` branch (line 320) with a centered block:
`<BagReachedEnd />` + `translate("You've reached the end")` heading +
`translate("You've seen everything in this list.")` subline. The `InView` sentinel
and loading spinner branches are unchanged; only the `isReachEnd` display changes.
The block spans the grid's full width and centers (the current
`absolute … bottom-[300px]` wrapper is adjusted so the illustration is horizontally
centered, not bottom-pinned to one column).

### 3. No-products — net-new empty state in `ProductListServer` (server)

`ProductListServer` (`components/Server/ProductList.tsx`) receives `products`. When
`products.length === 0`, render a centered `NoProductsFound` block **instead of**
the grid + `SortableGrid` + `ProductsInfiniteScroll` (no point mounting the infinite
scroll when the first page is already empty). The block: `<BagNoResults />` +
`translate("No products found")` + `translate("Try changing or clearing your
filters.")` + a **Clear filters** CTA.

- Server component ⇒ uses `translateFunction` from `utils/server`.
- The **CTA** is a small client `<Link>`-based control (its own file, e.g.
  `components/Listing/ClearFiltersButton.tsx`). It clears to the listing base —
  for a boutique, keep the boutique; otherwise the locale home listing
  (`/${country}-${language}`). Exact target URL reconstruction is a plan-phase
  detail.

#### CTA visibility rule — "filters applied (except single boutique)"

The CTA is shown **only when real filters are applied**. A lone boutique does not
count: on a single-boutique page with no other filters, a zero-result state means
the boutique itself is empty, so clearing would do nothing — hide the CTA.

Concretely, from `parseFiltersFromParams`, the active filter dimensions are:
`categories`, `related_categories`, `brands`, `colors`, `sizes`, `prices`,
`search_text`, `tags_names`, **plus** `boutiques` only when more than one is
selected. Show the CTA iff **at least one** of those is present/non-empty:

- single boutique only, nothing else → **hide**;
- single boutique **+** any other filter (e.g. a size or price) → **show** (clears
  back to the lone boutique, keeping it);
- no boutique + any filter/search → **show** (clears to home listing);
- no boutique, no filters → the empty state is unreachable here anyway.

The page-type flags `featured` / `flashdeal` are not user filters and are ignored
by this rule.

## Translations

Add the five keys above to `public/translations/translations.ar.js`,
`translations.tr.js`, and `translations.ku.js` with correct translations (Arabic &
Sorani are RTL — the listing already flips direction via `isRtl`). English needs no
entry (key fallback).

## Out of scope

- Directions B and C (concept-board alternatives).
- Any change to sort/filter behavior, pagination, or the Elastic query.
- Empty states elsewhere (wishlist, cart, orders) — this is listing-only.
- Dark-mode theming (storefront is light-only).

## Validation

No test suite (project policy). Verify by `pnpm build` / type-check and manual UX:
- Scroll a listing to the end → red-bag "reached end" illustration + translated copy
  appears, centered; sentinel/spinner still work mid-scroll.
- Search/filter for something with zero results → empty red-bag illustration +
  "No products found" + Clear filters CTA; CTA clears filters and reloads results.
- Switch locale to `ar` / `tr` / `ku` → copy is translated and RTL-correct; English
  shows the English fallback strings.
