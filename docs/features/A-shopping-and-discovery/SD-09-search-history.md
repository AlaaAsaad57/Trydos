# SD-09 — Search History

| | |
|---|---|
| **Feature ID** | SD-09 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Home/Search/SearchHistory.tsx`, `SearchIcon.tsx` |

---

## What it is

A list of the shopper's own recent searches, shown in the search overlay when the box is
empty, for quick re-search.

## Where it appears

- Inside the search overlay (SD-07), in the empty state, **above** trending — and only when the
  shopper has previous searches.

## Who uses it

Returning shoppers on the same device/browser.

## How it works (verified behaviour)

- **Where it's stored:** entirely in the browser's **local storage** (`search-history` key).
  It is **device- and browser-local** — not tied to the account and not synced across devices.
- **What gets added:** a term is saved to history when the shopper runs a search or taps a
  product result (handled in the overlay).
- **Collapsed view:** a horizontal, drag-to-scroll row of recent terms, each with a small
  **×** to delete that single term.
- **Expanded view:** a full list with per-item delete.
- **Tapping a term** re-runs its search and refills the box.
- **Clear All** empties the whole history.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/Home/Search/SearchHistory.tsx` |
| Storage | `localStorage["search-history"]` (JSON array of strings) |
| Add-to-history | `onClickSearchHistory()` (`utils/functions`), called from `SearchIcon.tsx` |
| Re-search | `search.getSearchOptions()` (`services/search.ts`) |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

- Because history is **local storage only**, it does not follow the user to another device or
  survive clearing browser data — by design, but worth stating for the manager (there is no
  server-side "recent searches" per account).

## Related features

SD-07 (Search overlay) · SD-08 (Trending — the store-wide counterpart).
