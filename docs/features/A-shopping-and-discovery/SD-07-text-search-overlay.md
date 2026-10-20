# SD-07 — Text Search Overlay

| | |
|---|---|
| **Feature ID** | SD-07 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Home/Search/SearchIcon.tsx`, `serverRequests/Search.tsx` |

---

## What it is

The main search experience: a full-screen overlay opened from the search icon, showing live
results grouped into **Products, Brands, Categories, Related categories and Boutiques**, with
inline "ghost-text" autocomplete and in-place filtering.

## Where it appears

- Opened from the **search icon** in the top bar of the homepage (and wherever that bar shows).
- Opening the overlay locks background scrolling; closing restores it.

## Who uses it

Every shopper — the primary way to find a specific product, brand, category or store.

## How it works (verified behaviour)

- **On open:** loads **trending searches** (SD-08) and the shopper's **search history**
  (SD-09, from local storage). Products are not fetched until the user types.
- **As the user types:** the query runs **debounced at 1.5 seconds**, with race-condition
  guards so a slower older request can never overwrite a newer one. Results come back grouped:
  - **Products** (shown once text is entered),
  - **Brands, Categories, Boutiques** — each a horizontal strip with its own **"Load More"**
    (loads in pages of 10; the button disappears when fewer than 10 come back),
  - **Related categories** — suggested when a category filter is active.
- **Smart query analysis:** for multi-word queries the text is passed through an **AI text
  analyzer** that cleans the wording and can automatically extract a **colour or size** and
  apply them as filters (e.g. "black shirt xxl"). The interpretation it used is surfaced to
  the shopper.
- **Inline autocomplete (ghost text):** as the user types, a grey "completion" of the most
  likely product name appears after the cursor. Accept it with **Tab**, or **→** when the
  caret is at the end. This is a separate, filter-aware suggestion query (also debounced 1.5s).
- **Refine in place:** tapping a brand/category/boutique in the results toggles it as a filter
  and re-runs the search (see SD-12). Category parent/child selections are kept mutually
  exclusive.
- **Go to full results:** a bottom **"Search"** button (showing the total product count) and
  the **Enter** key both navigate to the full listing page at `/{lang}/filters/<applied
  filters + text>`. A **Reset** button clears everything.
- **Other input modes:** when the field is empty, **image search** (SD-11) and **voice
  search** (SD-10) icons are available in the input.
- **Input limit:** the search box accepts up to 90 characters.

## Data source

| Path | How |
|------|-----|
| Main results | `GetSearchData()` server action (`serverRequests/Search.tsx`) → queries the **Elasticsearch catalog index directly** (products + aggregations for brands/categories/boutiques). |
| Query analysis | `AnalyzeSearchText` (`services/elastic/analyzeSearchText`) — AI-assisted, multi-word queries only. |
| Autocomplete | `GetSearchSuggestion()` server action → `match_phrase_prefix` on the product name (standard + Arabic analyzers), scoped to the active filters. |
| Search-term logging | Successful searches are logged (`logSearchTerm`) back to the index — this is what feeds Trending (SD-08). |

## Technical reference

| Item | Value |
|------|-------|
| Overlay component | `components/Home/Search/SearchIcon.tsx` (`SearchIcon` + `SearchContainer`) |
| Result item components | `components/Home/Search/Results/{ProductItem,BrandItem,CategoryItem,BoutiqueItem}.tsx` |
| Server actions | `serverRequests/Search.tsx` (`GetSearchData`, `GetSearchSuggestion`) |
| Debounce | 1500 ms (both main query and suggestion) |
| Page size | 10 per facet ("Load More"); products query size 20 |
| Full-results URL | `/{lang}/filters/<path-encoded filters + search>` |
| User id | `auth.UserID()` sent with the query (for search-term logging) |

## Current status & maturity

**Live and stable**, and clearly actively developed (autocomplete, AI query analysis, and
race/debounce hardening are all recent).

## Known gaps / notes

- The AI query analysis only triggers for **multi-word** queries (single words skip it).

## Related features

SD-08 (Trending) · SD-09 (History) · SD-10 (Voice) · SD-11 (Image) · SD-12 (In-search
filtering) · SD-14 (full listing page the "Search" button opens).
