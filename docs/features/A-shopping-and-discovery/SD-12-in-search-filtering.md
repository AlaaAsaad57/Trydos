# SD-12 — In-Search Filtering

| | |
|---|---|
| **Feature ID** | SD-12 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Home/Search/ActiveSearchFilterBar.tsx`, `SearchIcon.tsx`, `store/search/reducer.ts` |

---

## What it is

The ability to refine search results **in place** inside the search overlay — by tapping the
brands, categories and boutiques that come back — without leaving search. An active-filters bar
shows exactly what is applied.

## Where it appears

- Inside the search overlay (SD-07): the result strips are tappable, and the applied filters
  appear in a bar pinned near the bottom of the overlay.

## Who uses it

Shoppers narrowing a broad search (e.g. "shoes" → tap a brand + a category) before opening the
full results.

## How it works (verified behaviour)

- **Toggle by tapping:** tapping a brand, category or boutique in the results adds it as a
  filter; tapping again removes it. The results re-query (debounced) with the new filters.
- **Category logic:** selecting a **child** category clears any of its selected **parents**,
  and selecting a **parent** clears its selected children — so selections never conflict.
- **Colour & size from the query:** the AI query analysis (SD-07) can auto-add a colour or size
  filter detected in a multi-word query.
- **Active-filters bar:** `ActiveSearchFilterBar` shows chips for every applied
  category (with sub-categories), boutique, brand and the free-text term, each with its icon,
  plus a single **×** to clear them all.
- **Carrying filters forward:** the applied filters + text build the URL for the full listing
  page when the shopper taps "Search" (see SD-07 / SD-14).

## Technical reference

| Item | Value |
|------|-------|
| Active-filters bar | `components/Home/Search/ActiveSearchFilterBar.tsx` |
| Toggle logic | `toggleFilter()` in `components/Home/Search/SearchIcon.tsx` |
| Search store slice | `store/search/reducer.ts` (`searchFilters`, `setSearchCategory/Brand/Boutique/Color/Size/Price`, `resetSearchFilter`) |
| Filter types | categories, brands, boutiques, colours, sizes, price range, free text |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-07 (Search overlay) · SD-14 (full listing page + its own filter panel SD-15) · SD-16 (Sort).
