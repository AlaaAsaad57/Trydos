# SD-08 — Trending / Popular Searches

| | |
|---|---|
| **Feature ID** | SD-08 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Home/Search/SearchTrending.tsx`, `app/api/products/popular-search/route.ts` |

---

## What it is

A list of the store's currently popular search terms, shown inside the search overlay when the
box is empty, so shoppers can tap a trending term instead of typing.

## Where it appears

- Inside the search overlay (SD-07), in the **empty state** (before the user types anything).

## Who uses it

Every shopper opening search — especially useful for discovery and for quick re-entry to
popular queries.

## How it works (verified behaviour)

- **Collapsed view:** a single horizontal row of trending terms.
- **Expanded view:** tapping the trending icon opens a list showing each term **with its
  search count** and a "Clear All" action.
- **Tapping a term** puts it into the search box, which then runs a normal search (SD-07).
- **Where the terms come from:** the app calls `GET /api/products/popular-search`, which
  returns the **top 10** popular terms (term + count) computed from logged searches in the
  **Elasticsearch** index. Results are served with `no-store` (always fresh).
- **Self-reinforcing loop:** every successful search is logged back to the index by SD-07,
  which is what populates this list over time.

## Data source

| Item | Value |
|------|-------|
| Client call | `search.getTrendingSearch()` (`services/search.ts`) → `GET /api/products/popular-search` |
| Server | `getPopularSearchTerms(10)` (`services/elastic/helpers`) |
| Returns | `popular_search_terms: [{ term, count }]` |
| Caching | `Cache-Control: no-store` |

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/Home/Search/SearchTrending.tsx` |
| API route | `app/api/products/popular-search/route.ts` |
| Limit | 10 terms |
| Feeder | `logSearchTerm` in `serverRequests/Search.tsx` (SD-07) |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-07 (Search overlay — hosts this and feeds the term counts) · SD-09 (Search history —
the personal counterpart to trending).
