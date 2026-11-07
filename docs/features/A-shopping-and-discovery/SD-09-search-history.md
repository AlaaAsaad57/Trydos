# SD-09 — Search History

| | |
|---|---|
| **Feature ID** | SD-09 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-11-07 |
| **Source of truth** | `app/api/search/history/route.ts`, `services/elastic/searchHistory.ts`, `components/Home/Search/useSearchHistory.ts` |

---

## What it is

A list of the shopper's own recent searches, shown in the search overlay when the box is
empty, for quick re-search.

## Where it appears

- Inside the search overlay (SD-07), in the empty state, **above** trending — and only when the
  shopper has previous searches.

## Who uses it

Returning shoppers, on any device where they use the same account.

## How it works (verified behaviour)

- **Where it's stored:** in the **search log** in Elasticsearch, under the shopper's user id.
  It follows the account across devices. A guest's history belongs to the guest's id.
- **What gets added:** the word the shopper settled on, if it has 3+ characters, even with no
  products. A word counts as settled when it stays in the box for 1.5 seconds after its results,
  when the shopper leaves the search, or when they press Enter (the listing page logs that one).
  Half words typed on the way are not logged. The list shows up to 50 words, newest first, each
  word once.
- **Collapsed view:** a horizontal, drag-to-scroll row of recent terms, each with a small
  **×** to delete that single term.
- **Expanded view:** a full list with per-item delete.
- **Tapping a term** re-runs its search and refills the box.
- **Clear All** empties the whole history.
- **Removing a word** sets `is_deleted: true` on the rows. The rows stay in the log for other
  apps, and the history hides them. Searching the word again brings it back.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/Home/Search/SearchHistory.tsx` |
| Storage | The search log index (`search_log_index`) |
| API | `GET` / `DELETE /api/search/history` — see `docs/mobile-search-history-api.md` |
| Add-to-history | `useSearchLog` (`components/Home/Search/useSearchLog.ts`), then `POST /api/search/history` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

- A guest's words do not move to the account when the guest signs in.
- Words saved in a browser's local storage by older versions are not carried over.

## Related features

SD-07 (Search overlay) · SD-08 (Trending — the store-wide counterpart).
