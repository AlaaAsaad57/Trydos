# Listing search → `?search=` search-param refactor

**Date:** 2026-07-05
**Status:** design — awaiting review
**Mode:** high-risk (wide blast radius: three listing routes, homepage search, SEO meta + sitemap, a load-bearing client grid component)
**Owner:** ai_agent (authored) — human reviews/verifies

---

## 1. Problem

The listing search box stores the query in the **URL path** (`/en-gb/filters/search/<value>`). On every edit it calls `buildParamsFromFilters` → `router.push('/…/filters/search/<value>')` — a **path navigation**. Because the listing renders under a `@modal/(.)filters` intercept, that push re-runs the whole `FiltersPageContent` through its `<Suspense>` boundaries. The result is every symptom we want gone:

- The page **flips** — filter widget, filter chips, and product grid all fall back to skeletons.
- The input **remounts** → **focus and caret are lost** mid-typing.
- The field is effectively **controlled by the URL** (`value={pollinateInput(search_text)}`), reinforcing the remount/focus problem.
- The component leans on **imperative DOM hacks** (`document.querySelector(...).classList / .style.display`) for collapse/expand and hiding the boutique logo — fragile and hard to reason about.

The **sort** flow already solved the same class of problem for re-ordering: sort lives in a **search param** (`?sort=`), and a client component (`SortableGrid`) refetches the grid via a server action instead of re-rendering the RSC. This refactor generalises that solution to search.

## 2. Goals

1. **Search lives in `?search=`** (a query param), not the path. It composes with path filters: `/en-gb/filters/categories/shoes?search=nike`.
2. **No page flip, no focus loss** while typing — the input is a locally-controlled client field that survives the URL change.
3. **Never a skeleton while searching.** Instead, a small **spinner inside the input** shows from the first keystroke until the new results land.
4. **Debounced commit:** the query auto-commits **1.5 s** after typing stops; **Enter flushes immediately**. Commit updates `?search=` via `router.replace` (no history spam) and is shareable.
5. **Collapsed when empty/unfocused; expanded on focus or when it has a value.**
6. **Analyze-search keeps working** — the free-text query is still ES-analyzed (`isAnalyzed`: detected color/size/brand + the analyzed `name`) and the grid shows the analyzed results.
7. **Sort / filter / share empty-gate reacts to the search result** — a search that returns 0 results hides the trio; a search that returns results shows it.
8. **Correct grid + empty-state** — a client search that returns 0 shows the same "No products found" UI as the server path.
9. `?search=` is the **single source of truth** everywhere: homepage global search, listing canonical meta, and the sitemap all emit `?search=`, and legacy `/filters/search/<value>` links **308-redirect** to it.
10. Applies **uniformly** across `filters`, `featured`, and `flashDeals` (all three render the same search bar + grid).

## 3. Non-goals (confirmed out of scope)

- The **filter aggregation query** and the filter chips / filter panel. Changing the search does **not** re-run the aggregation query; the chips stay as the server rendered them. (Only the product grid, the empty-gate, the analyze metadata, and the input spinner react to a client search.)
- **ES query internals.** We only *forward* fields already present in the ES response (`isAnalyzed`, `products`, `offset`); we do not change how the query is built or scored.
- **Mobile `searchInCatalog`** (`app/api/products/searchInCatalog/route.ts`) — untouched.

## 4. Current architecture (as-is)

| Concern | Where | Behaviour |
|---|---|---|
| Search input | `components/filterPage/SearchBoutiquePage.tsx` | Client. On Enter/clear builds a path via `buildParamsFromFilters` and `router.push`. Value bound to server `search_text`. Ghost-suggestion overlay. DOM hacks for collapse + logo. |
| Path parse | `utils/server/index.tsx › parseFiltersFromParams` | `search/<value>` path pair → `filters.search_text = [value]`. |
| Path build | `utils/server/index.tsx › buildParamsFromFilters`, `utils/tinyUtils.tsx › buildParamsFromFilters` | Emit `search/<value>` into the path. |
| Server render | `page.tsx` (×3) → `FiltersPageContent` | Reads `sort` from `searchParams`; injects `search_text` from the path into the ES query. |
| Grid refetch on sort | `components/Server/SortableGrid.tsx` | Client. Watches `?sort=`; when it differs from the server's sort, mounts a fresh `ProductsInfiniteScroll` (page-1, client `GetProducts`). Relies on `staleTimes.dynamic:30` not varying the RSC by query param. |
| Empty-gate | `components/Server/ListingBarActions.tsx` | Server. Awaits `filtersPromise`; hides sort/filter/share when server `products` is empty. |
| Analyze-search | ES response `isAnalyzed`; `ProductListConainer` uses `isAnalyzed?.name` as the paginating `search_text`. | Server pre-analyzes; pages reuse the analyzed name. |
| Homepage global search | `components/Home/Search/SearchIcon.tsx` | Enter + "Search" button `router.push('/…/filters/<path incl. search/value>')`. |
| SEO | `serverRequests/meta/*`, `services/elastic/sitemap.service.ts` | Canonical URLs / sitemap emit the path form. |

## 5. Target architecture (to-be)

### 5.1 URL & source of truth
- `?search=<value>` is canonical. Path filters remain in the path; **search is only ever a query param** after this change.
- **Legacy redirect:** a request to `/{lang}/filters/…/search/<value>/…` (search present as a path pair) **308-redirects** to the same path with the `search` pair removed and `?search=<value>` appended (other path filters and existing query params preserved). Applied to `filters`, `featured`, `flashDeals`. Locus: the server page component (`redirect()` from `next/navigation`) — it runs before render and is invisible to the modal intercept. (Middleware `proxy.ts` considered and rejected: heavier, and the three routes are already the natural choke point.)

### 5.2 Server read (SSR / shared links / no-JS)
`page.tsx` (×3) reads `search` from `searchParams` exactly like `sort`, and passes it to `FiltersPageContent`. `FiltersPageContent`:
- Computes the **effective search** = `?search=` (query wins) — path search no longer occurs post-redirect, but the merge is defensive.
- Injects it as `search_text` into the ES query.
- Adds `search` to the `dedupeRequest` key (alongside `sort`).
- Threads a `serverSearch` value down to the search input and the grid controller (so the client knows the query the server already rendered).

### 5.3 Client grid controller (generalise `SortableGrid`)
`SortableGrid` becomes the single watcher of **both** `?sort=` and `?search=`:
- Remount key: `sorted-${sort}-${search}`.
- **Server-grid path:** when live `?sort=`/`?search=` both equal the server's, render the untouched server-rendered `children` (SSR default, unchanged for the no-search / shared-link case).
- **Client path:** when either differs, mount a fresh `ProductsInfiniteScroll` from page 1, fetching client-side via the server action — **always fresh**, bypassing the `staleTimes.dynamic` RSC cache. **No skeleton for the search path** (`firstPageSkeleton` stays off; the input spinner is the only progress signal).
- After each client page-1 fetch it writes result state to the store (§5.6) so the empty-gate, input spinner, and empty-state react.

### 5.4 Analyze-search threading
- **Page 1 of a client search** calls the server action with the **raw** typed query as `search_text`. ES analyzes it (same code path as the server's initial render) and returns `isAnalyzed` + products.
- The controller captures `analyzedName = isAnalyzed?.name ?? rawQuery` and feeds it as `search_text` to **subsequent** infinite-scroll pages — exact parity with `ProductListConainer`'s current server behaviour, so page 2+ stays consistent with the analysis and the PIT snapshot.
- `GetProducts` is extended to **forward** `isAnalyzed` from the ES response (it already receives it; it just doesn't return it today). No ES-query change.

### 5.5 Search input (rebuilt `SearchBoutiquePage`)
- **Locally controlled** value, initialised from `serverSearch`. Decoupled from the URL → typing keeps focus/caret. `pollinateInput(search_text)` binding removed.
- **Commit model:** `setTimeout(1500)` after the last keystroke → commit; **Enter** clears the timer and commits now. Commit = `router.replace(pathname + '?search=' + value)` (or removes the param when empty). `replace` → no history spam; URL still fully shareable.
- **Spinner:** first keystroke sets `searchLoading = true` → a small `Spinner` renders where the search icon sits; cleared by the controller when the fetch lands (§5.6).
- **Collapse/expand** via React state + a store flag (§5.6): collapsed (icon only) when empty **and** unfocused; expands on focus (tab/click) or whenever value is non-empty; blur-with-empty collapses.
- **Ghost-suggestion / inline completion** feature retained (Tab / ArrowRight-at-end to accept; `GetSearchSuggestion`), rebuilt without DOM hacks.
- RTL/`dir` parity for input, ghost overlay, and spinner preserved.

### 5.6 Cross-component state (`store/listing` UI slice)
| Flag | Written by | Read by | Purpose |
|---|---|---|---|
| `searchLoading: boolean` | input (true on keystroke); controller (false when page-1 lands / server-grid shown) | input | In-input spinner spanning typing → results. |
| `searchHasResults: boolean` | server seed (initial), controller (after each client fetch: `page-1 products.length > 0`) | empty-gate wrapper, grid empty-state | Reactive sort/filter/share gate + "No products found". |
| `searchExpanded: boolean` | input (focus/value) | bar container width, `BoutiqueMiniLogo` | Collapse/expand + hide boutique logo — replaces `document.querySelector` hacks. |

The controller also clears `searchLoading` in the **server-grid** branch (mirrors SortableGrid's existing `showingServerGrid` effect that clears the page loader) so reverting to the server's query never hangs the spinner.

### 5.7 Reactive empty-gate
`ListingBarActions`' gating splits into a thin **client** wrapper: it takes the server's initial `hasResults` as its seed and then subscribes to `searchHasResults`. The gated trio (`ListingSortControl`, `FilterBoutiquePageButton`, `ListingShareControl`) and the search input's always-visible rule are otherwise unchanged. Sort itself doesn't change the count, so only search moves the gate.

### 5.8 Client empty-state
When a client search page-1 returns 0 products, the grid shows the same "No products found" block used by `ProductListServer` (`BagNoResults` + conditional "Clear filters" CTA) — not skeletons and not the "reached end" bag. This lives in / next to the grid controller so both the server and client zero-result paths look identical.

## 6. Data-flow diagram

```
page.tsx (filters | featured | flashDeals)
  ├─ legacy /search/<v> path  ──308──► same path + ?search=<v>
  ├─ read searchParams → { sort, search }
  └─ pass { sort, search } ▼
FiltersPageContent
  ├─ effective search_text = ?search=  → ES query (dedupeRequest key incl. search)
  ├─ ListingSearchContainer(serverSearch)         → SearchBoutiquePage (client, local value)
  ├─ ListingBarActions(initialHasResults)         → client gate ⇄ store.searchHasResults
  └─ ProductListConainer(serverSearch, sort)
        └─ ProductListServer → SortableGrid(serverSort, serverSearch)
              ├─ live == server → server grid (SSR children)
              └─ live != server → ProductsInfiniteScroll (client GetProducts)
                    page 1: search_text = raw query  → capture isAnalyzed.name
                    page n: search_text = analyzedName, pit_id
                    writes store.{searchLoading, searchHasResults}
```

## 7. Files touched

**Client**
- `components/filterPage/SearchBoutiquePage.tsx` — full rebuild (local value, `?search=` replace-commit, 1.5s+Enter, spinner, store-driven collapse, keep ghost text).
- `components/Server/SortableGrid.tsx` — watch `search` too; remount key; write result state to store; clear spinner on server-grid branch.
- `components/ListingPage/ProductInfiniteScroll.tsx` — accept a "search page-1" mode: forward `isAnalyzed.name` to later pages; set `searchLoading=false` + `searchHasResults` when page 1 lands; render/trigger the zero-result empty-state instead of skeleton.
- `components/Server/ListingBarActions.tsx` — split gate into a client wrapper seeded by server `hasResults`, subscribed to `searchHasResults`.
- `components/Listing/BoutiqueMiniLogo.tsx` — hide via `searchExpanded` store flag instead of being hidden by querySelector.
- `components/Home/Search/SearchIcon.tsx` — Enter + "Search" button navigate to `?search=` (compose with any category/brand/boutique path filters).

**Server**
- `app/(client)/[lang]/filters/[[...filters]]/page.tsx`, `.../featured/[[...filters]]/page.tsx`, `.../flashDeals/[[...filters]]/page.tsx` — read `search` from `searchParams`; legacy path→query 308 redirect; pass `search` down.
- `app/(client)/[lang]/@modal/(.)filters/[[...filters]]/page.tsx` — pass `search` down (redirect handled by the real route).
- `components/Listing/FiltersPageContent.tsx` — accept `search`; effective `search_text`; dedupe key; thread `serverSearch`.
- `components/Server/ListingSearchContainer.tsx`, `components/Server/ProductListConainer.tsx`, `components/Server/ProductList.tsx` — thread `serverSearch`.
- `serverRequests/listing/index.tsx › GetProducts` — forward `isAnalyzed`; accept the raw-vs-analyzed `search_text` distinction.
- `serverRequests/meta/listing.tsx`, `serverRequests/meta/StructuredData/*`, `services/elastic/sitemap.service.ts` — emit `?search=` canonical.

**State**
- `store/listing/reducer.ts` — add `searchLoading`, `searchHasResults`, `searchExpanded` + setters.

**Utilities**
- `utils/server/index.tsx › parseFiltersFromParams`, `utils/tinyUtils.tsx › buildParamsFromFilters`, `serverRequests/meta/StructuredData/utils.ts › buildParamsFromFilters` — stop treating `search` as a path segment (keep parse tolerant for the redirect's benefit; stop *emitting* it into paths).

## 8. Edge cases & risks (high-risk register)

1. **RSC cache assumption.** Flip-free behaviour depends on `staleTimes.dynamic` not varying the RSC by query param — the exact assumption sort already ships on. If a future config change makes query params re-render the RSC, both sort and search regress together (single shared failure mode, not a new one).
2. **`isAnalyzed` on `noFilters`.** Confirmed the `noFilters:true` path returns `isAnalyzed` + `products` (elasticSearch.ts:553,556). `total_size` is unreliable under `track_total_hits:false`, so the gate/empty-state key off **`products.length > 0`**, not the count.
3. **Empty-gate seed vs reality.** On first paint the gate uses the server's `hasResults`; a shared `?search=` link is rendered server-side with that search, so the seed is already correct. Client edits then keep it in sync via the store.
4. **Modal intercept.** Query-only `replace` keeps the same path → the `@modal/(.)filters` intercept does not re-trigger; the listing does not remount.
5. **Analyze pagination consistency.** Page 2+ must reuse `isAnalyzed.name` (not re-analyze the raw text) to stay aligned with the PIT snapshot — mirrored from current server behaviour.
6. **Dropped path-stripping.** The old `onKeyDown` stripped analyzed colors/sizes from the *filter path* when submitting; since search no longer rewrites the path, that logic is removed. Filters are exactly what the path defines (consistent with non-goals).
7. **Homepage compose.** `SearchIcon` must merge `?search=` with any category/brand/boutique path filters it already builds, not replace them.
8. **SEO.** Redirect must be **308** (permanent, method-preserving) so link equity transfers; canonical + sitemap must agree on the `?search=` form to avoid duplicate-URL signals.

## 9. Acceptance criteria

- **AC-1** Typing in the listing search never flips the page and never loses input focus/caret.
- **AC-2** No skeleton appears while searching; a small spinner shows in the input from the first keystroke until results render.
- **AC-3** The query commits to `?search=` 1.5 s after typing stops, or immediately on Enter, via `router.replace`.
- **AC-4** The input is collapsed when empty & unfocused, and expanded on focus or when it holds a value; the boutique logo hides while expanded.
- **AC-5** The grid shows the **analyzed** results for the query (parity with the current path-based analyze-search), and infinite-scroll pages stay consistent with the analyzed name.
- **AC-6** A search returning 0 results shows the "No products found" empty-state and hides the sort/filter/share trio; a search returning results shows the trio and the grid.
- **AC-7** Copying/opening the URL reproduces the exact search (+ path filters + sort) on load via SSR.
- **AC-8** Legacy `/filters/search/<value>` links 308-redirect to `?search=`; homepage search, canonical meta, and sitemap emit `?search=`.
- **AC-9** Sort × search compose correctly (grid re-pages from page 1 for any combination) across `filters`, `featured`, `flashDeals`.
- **AC-10** No `document.querySelector`-driven cross-component effects remain in the search bar; collapse/logo/spinner/gate are all store- or prop-driven.

## 10. Validation (no automated tests in this repo)

Manual, per `filters` / `featured` / `flashDeals`, LTR + RTL:
1. Type a multi-word analyze query (e.g. "red nike shoes") → spinner in input, no skeleton, grid updates to analyzed results after ~1.5 s; scroll paginates consistently.
2. Enter flushes immediately.
3. Search to a no-match query → "No products found", trio hidden; clear it → trio + grid return.
4. Reload the shared `?search=` URL → same state via SSR.
5. Open a legacy `/filters/search/<value>` link → 308 to `?search=`.
6. Homepage search → lands on `?search=`.
7. Compose search with a category path filter and a sort → all three coexist in the URL and the grid.
8. `pnpm build` + `pnpm lint` clean; `pnpm knip` shows no newly-orphaned exports.

## 11. Rollback

Single-branch, additive-then-swap. Revert is a `git revert` of the branch: the path-based search still exists in `parseFiltersFromParams` (kept tolerant), so reverting the client + page changes restores path search with no data migration. The legacy redirect is the only externally-visible change; removing it restores the old URLs directly.
