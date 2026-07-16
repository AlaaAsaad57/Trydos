---
ticket: listing-pagination-no-dup-no-skip
stage: research
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Research — listing-pagination-no-dup-no-skip

> Read-only phase. **No implementation was performed.**

## Goal

Eliminate intermittent **duplicate** products and silent **skips** in the
listing infinite scroll across `/filters`, `/featured`, `/flashDeals`, and
boutique pages — including the journey *land → load more → change filter → load
more* — **without changing the Elasticsearch index mapping or the sort**.

## Relevant directories

- `components/ListingPage/` — `ProductInfiniteScroll.tsx` (client list, holds the
  dedupe `Set`, offset cursor, appended products); `FilterItem.tsx` (filter UI →
  URL navigation).
- `components/Server/` — `ProductListConainer.tsx`, `ProductList.tsx` (server
  wiring; the `parsedFilters`-keyed boundary that remounts the list).
- `components/Listing/` — `FiltersPageContent.tsx` (server component, initial
  page fetch).
- `services/elastic/` — `elasticSearch.ts` (`getProductsAndFiltersFromElastic`:
  query, sort, `search_after` cursor).
- `serverRequests/listing/` — `index.tsx` (`GetProducts` server action for "load
  more"). **Protected path (`serverRequests/**`).**

## Relevant config files

- `.claude/project-config.yaml` — `protected_paths` lists `serverRequests/**`;
  touching it forces `mode: high_risk` (MO-3).
- `next.config.ts` — runtime config (no change planned).
- Elasticsearch connection/runtime (no mapping change in scope).

## Possibly affected services

- **Elasticsearch** — pagination correctness; adding a Point-in-Time (PIT)
  snapshot is a runtime API call, **not** a mapping/index change.
- **Listing SSR + "load more" server action** — must thread a snapshot id from
  the initial render through every subsequent page.
- **Analytics (GA `view_item_list`)** — currently emitted per appended page; must
  stay correct when the dedupe/auto-advance logic changes.

## Test / validation commands available

- `pnpm build` / `pnpm lint` — type + lint (repo has **no automated test suite**;
  validation is manual + type-checking per CLAUDE.md).
- Manual repro: scroll a relevance-ranked listing (with `search_text`) through
  many pages on a multi-replica index while the catalog is being refreshed.

## Findings (root cause)

1. **Duplicates / skips at the source.** Pagination uses `search_after` with a
   `[_score, id]` cursor (`elasticSearch.ts:233`, cursor `:261`/`:476`, consumed
   `serverRequests/listing/index.tsx:138`). The query sets **no PIT, no
   `preference`, no `dfs_query_then_fetch`** (`elasticSearch.ts:221-249`). The
   `id` tiebreaker only stabilizes a *single* response; across two independent
   requests the primary key `_score` can drift (different shard replicas; a
   refresh/merge between requests). Drift **up** → a boundary doc repeats
   (duplicate); drift **down** → a boundary doc is jumped (skip). This matches
   the "sometimes, not always" symptom.

2. **A client fallback renders whole duplicate pages.** `ProductInfiniteScroll.tsx`
   dedupes by id via `seenIdsRef` (seeded `:66-68`) but, when an entire incoming
   page is already-seen (`uniqueIndexes.length === 0`), falls back to appending
   the full page verbatim (`:144-147`). Reach-end detection compares the drifting
   `[_score, id]` cursor (`:123`), so it is also unreliable.

3. **Filter changes already reset client dedupe (verified).** Filters apply via
   `NextLink` navigation to a new URL path (`FilterItem.tsx:85-96`, `:698-704`;
   `NextLink.tsx:45`). The list sits inside a `JSON.stringify(parsedFilters)`-keyed
   boundary (`ProductListConainer.tsx:100-101`, `:118-124`; child at
   `ProductList.tsx:66`), so a filter change **remounts** `ProductInfiniteScroll`,
   re-seeding `seenIdsRef`, `products`, and `offsetValue` from the new first page.
   `dynamic = "force-dynamic"` guarantees a fresh SSR page per filter path. All
   dedupe/offset state is **component-local**; nothing global leaks across
   filters.

4. **Latent trap.** `store/listing/reducer.ts` holds a `products`/`offset` slice
   with its own dedupe (`getNextProducts` `:60-74`) that **persists across
   navigation**. It is currently **dead code** for this list (the component never
   reads it). Safe today only because it is ignored.

## Risks and unknowns

- **PIT lifecycle** — keep-alive TTL sizing; behavior when a PIT expires during a
  long browse (graceful re-open vs. end-of-list); best-effort close on unmount.
- **Protected path** — `serverRequests/listing/index.tsx` is protected; change is
  only permitted at an approved `/implement` and must carry a protected-path
  impact statement at `/verify` (VF-9/TR-3).
- **Stateful pagination** — threading a snapshot id SSR→client adds a contract
  field across several components; must reset correctly on every filter change.
- **No automated tests** — correctness must be proven by a manual, reproducible
  validation procedure + rollback rehearsal (high_risk).

## Open questions

- ~~Snapshot keep-alive duration, and the desired behavior on expiry.~~
  **Resolved (OQ-1):** on expiry, transparently re-open a fresh snapshot and
  continue from the last cursor — never end early (Layer 1 still guarantees no
  duplicate across the boundary). Keep-alive sized generously and refreshed per
  page. See `spec.md > Resolved Decisions` / `plan.md` step 5.
- ~~Should the same approach extend to the related-products carousel
  (`GetRelatedProducts`)?~~ **Resolved (OQ-2): yes** — same defects, now in scope
  (FR-7 / AC-14).
- ~~Should PIT ship behind a runtime flag?~~ **Resolved: yes** — see plan Rollback.

> The related-products carousel (`components/Product/RelatedProductsInfiniteScroll.tsx`)
> was confirmed to carry the **identical** defects: the same `: response.items`
> all-duplicate fallback (lines 95-98) and the same `sameOffset` end-detection
> (lines 77-82), over the same `search_after` path (`getRelatedProducts`).

## Notes

- No code was changed during research.
- No protected runtime configs were modified.
