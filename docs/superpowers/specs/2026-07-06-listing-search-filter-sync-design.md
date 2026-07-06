# Listing Search ↔ Filter Sync — Design

**Date:** 2026-07-06
**Status:** Approved (pending written-spec review)
**Depends on:** `docs/superpowers/plans/2026-07-05-listing-search-searchparams.md` (the `?search=` refactor — search now lives in the `?search=` query param, committed client-side by the rebuilt `SearchBoutiquePage`).

## 1. Problem

The `?search=` refactor made the listing search a **client-side** concern: typing
commits `?search=` via `router.replace`, and — because `next.config`
`staleTimes.dynamic` does not vary the RSC by query param — the server does **not**
re-render. Only the grid refetches client-side (`SortableGrid` → `GetProducts`).

Everything else on the page that describes the result set is **server-rendered**
from `filtersDataPromise` and never learns about a typed search:

- **In-page filter list** (`FilterListContainer → FilterList → FilterItem` circles,
  price ranges) — stays scoped to the pre-search result set.
- **Active-filters bar** (`ActiveFiltersBar` inside `FilterList`) — its search-chip
  branch reads `parsedFilters.search_text`, which is populated **only from the URL
  path**. Since search moved to `?search=`, that value is always empty → the chip
  never shows.
- **FiltersWindow modal** — its `GetFilters` calls pass
  `search_text: initialFilters.search_text` (path-only, empty), so the modal's
  facets are not scoped to the search either.

This produces the three reported gaps:

1. **Filters don't update based on the search.**
2. **Clearing filters doesn't remove the search.**
3. **Search doesn't appear as an active filter when applied.**

Root cause is singular: **search is client-state; the filter UI is server-rendered
and blind to it.**

## 2. Goals / Non-goals

**Goals**

- Typing a search re-scopes the in-page filter list (circles + price ranges) to the
  search results — **focus-safe, no full reload** (Req 1).
- The applied search shows as a chip in the active-filters bar, on **both** the
  typed-search path and the server-rendered path (path-tap / shared link) (Req 3).
- The search chip is **individually removable** (clears only `?search=`, keeps other
  filters); the global **clear-all** removes everything **including** the search
  (Req 2).
- The FiltersWindow modal's facets are scoped to the active search too (Req 1,
  fuller surface).
- The search box stays in sync with `?search=` so chip-removal / clear-all flow back
  into the box.

**Non-goals**

- No change to the ES query internals or the filter aggregation shape — we only
  forward the existing `search_text` into the existing `GetFilters` call.
- No change to how path filters navigate (they already re-render the server; the
  prior fix already makes filter toggles carry `?search=`).
- No change to the grid refetch (`SortableGrid`) — it already handles `?search=`.
- Mobile `searchInCatalog` is untouched.

## 3. Approach — extend the client-refetch pattern

The grid already models the correct pattern: **while live `?search=` equals what the
server rendered, show the server output; the moment it differs, refetch that surface
client-side from a Server Action and render the fresh data.** We apply the same
"server-seeded, client-reactive" pattern to the filter list and active bar, and thread
the effective search into the modal.

Two distinct triggers, converging on the same correct state:

- **Type a search** → query-only `router.replace(?search=)` → server does **not**
  re-render → grid refetch (exists) **+ filter-list refetch (new)** + search chip
  driven by live URL (new), all client-side, focus preserved.
- **Tap a filter** → path navigation carrying `?search=` → server **re-renders**
  scoped to path-filters **and** `?search=` (already wired via `effectiveSearch`) →
  grid, filter circles, and chip all come from the server in one combined ES query;
  the client controllers stay dormant (`live search === serverSearch`).

### Why client-refetch over full server re-render

| | Client refetch (**chosen**) | Full server re-render |
|---|---|---|
| Typing UX | Focus/caret preserved | Caret jump / focus loss mid-type |
| Work per typed search | Incremental: grid + one `GetFilters` refetch | Full RSC re-render + re-hydration, busts `staleTimes` cache |
| Fits current architecture | Yes (mirrors the grid) | No (reverses the refactor) |

Per-interaction cost is lower (fetch only what changed vs. re-render + re-stream +
re-hydrate the whole tree on every debounced commit), and it preserves the smooth
typing the refactor was built to protect.

## 4. Components & data flow

### 4.1 `FilterListReactive` — client controller for the in-page filter list

**New client component** wrapping the filter-list render. Contract:

- **Consumes:** server-seeded `serverFilters` (today's `filters` object built in
  `FilterListContainer`), `serverSearch` (the `effectiveSearch` the server rendered
  with), `parsedFilters`, `params`, `currency`, `isFeatured`, `isFlashDeals`,
  `itemsLength`; store flags from the refactor (`searchLoading`).
- **Reads** live `?search=` via `useSearchParams`.
- **Behavior:**
  - `searchParam === serverSearch` → render the presentational view from
    `serverFilters` (server already reflects this search; covers no-search, path-tap,
    shared link).
  - `searchParam !== serverSearch` → debounced `GetFilters({ country, language,
    filters: { ...parsedFilters, search_text: searchParam || undefined } })`; while
    in flight keep showing the last-known view (no skeleton flash — the in-input
    spinner already signals progress); on resolve, render the presentational view
    from the refetched aggregations. Guard against out-of-order responses (latest-
    request-id ref, mirroring `SearchBoutiquePage`'s suggestion fetch).
- **Produces:** the same DOM the current `FilterList` produces.

**Refactor to avoid duplication:** extract the presentational body of today's
`FilterList` (the `FilterItemsRow` circles + `ActiveFiltersBar`) into a
**`FilterListView`** client-capable presentational component that takes a `filters`
data object + an explicit `searchText`. Both the server path (`FilterListContainer`)
and `FilterListReactive` render `FilterListView`; the reactive controller only decides
*which* data (server-seeded vs. refetched) and *which* search to pass. `FilterItem` is
already `"use client"`, so rendering circles client-side is a no-op boundary-wise.

`FilterListContainer` (server) stays responsible for the initial ES-derived
`serverFilters` and now also passes `serverSearch` (the page's `effectiveSearch`) down,
wrapping `FilterListView` in `FilterListReactive`.

### 4.2 Reactive active-filters bar + individually-removable search chip

`ActiveFiltersBar` becomes part of `FilterListView` and receives an explicit
`searchText` (the effective search — live URL value the controller resolved), instead
of reading `parsedFilters.search_text` (path-only, always empty post-refactor). The
existing search-chip branch renders whenever `searchText` is non-empty — so it shows on
both the typed and server-rendered paths (Req 3).

The chip gains an individual **✕** control:

- Clears **only** `?search=`: build the current URL with `search` deleted from the
  query (keep path + other query params like `sort`), `router.replace(..., { scroll:
  false })`.
- This is a query-only change → focus-safe, and it flips `searchParam` back toward
  `serverSearch`/empty, so `FilterListReactive` and `SortableGrid` re-scope to the
  base result set automatically.

Because chip-remove and clear-all are simple URL edits, they need a **client** element;
the ✕ becomes a small client control inside the (now client-capable) `FilterListView`.

### 4.3 Clear-all removes search (Req 2)

`ActiveFiltersBar`'s global reset (`getResetUrl()`) already targets a **clean path with
no query string** (`/<lang>/filters`, or the single-boutique path), so it inherently
drops `?search=`. This design **makes that explicit** and adds a regression note: the
reset URL must never carry the active query. Filter **toggles** intentionally keep
`?search=` (already implemented in `getFilterStateForItem` via `activeQueryString`);
only clear-all and the chip-✕ remove it.

### 4.4 FiltersWindow modal scoped to search (Req 1, fuller surface)

Thread the effective search into the modal so its `GetFilters` calls are search-scoped:

- `FilterWidgetServer` → `FiltersWindow` receives `serverSearch` (the page's
  `effectiveSearch`).
- `FiltersWindow` seeds `initialSelectedChips.search_text` from `serverSearch` (not
  from `initialFilters.search_text`, which is path-only). Its existing
  `UpdateFilters()` already sends `{ ...selectedChips, prices }` to `GetFilters`, so
  once `search_text` is seeded the modal's facets and totals reflect the search with no
  further change.
- The modal reading the **live** `?search=` (for the case where the user typed a search
  and then opened the modal without a server re-render) is handled the same way as the
  list: seed from `serverSearch`, and if the modal must reflect a not-yet-server-known
  typed search, read `?search=` via `useSearchParams` at open. (Detail deferred to the
  plan; the seeding path covers path-tap / shared-link / reload.)

### 4.5 Search box ↔ URL sync

`SearchBoutiquePage` currently owns `value` as local state seeded once from
`serverSearch`. To let chip-✕ / clear-all flow back into the box:

- When the box is **not focused**, mirror `value` to the committed `?search=` (live
  URL). When **focused** (mid-typing), local state wins — never yank the caret.
- This keeps a single source of truth (`?search=`) for committed search while
  preserving focus-safe typing.

## 5. Edge cases

- **Rapid typing:** debounce the `GetFilters` refetch and drop out-of-order responses
  (latest-id ref). The list shows the previous facets until the newest resolves — no
  skeleton flash (the in-input spinner is the progress signal).
- **Zero results for a search:** `GetFilters` returns empty facet arrays →
  `FilterListView` renders no circles; the grid already shows the "No products found"
  empty-state; the search chip still shows so the user can remove it.
- **Search + path filter together:** path-tap re-renders the server with both →
  controller dormant → consistent. Removing the search chip keeps the path filter.
- **`sort` present with search:** chip-✕ deletes only `search`, preserving `sort` (and
  vice-versa). Clear-all drops the whole query.
- **RTL:** unchanged; chip and ✕ inherit the existing bar's RTL handling.
- **Boutique page:** clear-all keeps the single boutique (existing `getResetUrl`
  behavior); the search chip and its ✕ behave identically.

## 6. Performance

- Typed search adds **one** incremental Server Action call (`GetFilters`, facets only —
  it already runs `noProducts: true`) alongside the existing grid refetch, fired only
  when `?search=` actually changes, debounced. No full-tree re-render or re-hydration,
  no `staleTimes` cache bust.
- Path-tap path is unchanged (one combined ES query on the server, as today).
- `React Compiler` is enabled — no manual memoization unless profiling shows a need.

## 7. Out of scope

- ES query internals / aggregation response shape.
- The grid refetch (`SortableGrid`) — already handles `?search=`.
- Homepage search (`components/Home/Search/*`, its own `ActiveSearchFilterBar`).
- Adding any test suite (repo policy: no tests).

## 8. Verification (no test suite)

- `npx tsc --noEmit` — types clean.
- `pnpm lint` — no new errors.
- `pnpm build` — server/client boundary holds (authoritative for the new client
  components; `useSearchParams` usage sits in already-dynamic listing routes).
- Manual, on `/en-gb/filters`, `/en-gb/featured`, `/en-gb/flashDeals`, and once RTL
  (`/sy-ar/filters`):
  1. Type a search → filter circles + price ranges re-scope to the results, box keeps
     focus, no full reload, search chip appears.
  2. Tap a filter while searching → server re-renders scoped to both; circles, grid,
     chip stay consistent.
  3. Tap the search chip ✕ → only the search clears; other filters remain; box clears.
  4. Clear-all (bar reset) → everything clears including search.
  5. Open the FiltersWindow modal while searching → its facets/totals reflect the
     search.
  6. Shared link `/en-gb/filters?search=nike` → chip shows and filters are scoped on
     first paint.

## 9. Component/interface summary

| Unit | Kind | Responsibility | Depends on |
|------|------|----------------|-----------|
| `FilterListView` | client (presentational) | Render filter circles + active bar from a `filters` data object + `searchText` | `FilterItem`, `ActiveFiltersBar` |
| `FilterListReactive` | client (controller) | Choose server-seeded vs. `GetFilters`-refetched data by comparing live `?search=` to `serverSearch`; render `FilterListView` | `GetFilters`, `useSearchParams`, store `searchLoading` |
| `ActiveFiltersBar` (in `FilterListView`) | client | Render active chips incl. search chip from explicit `searchText`; chip-✕ clears only `?search=`; global reset clears all incl. search | `useRouter`/`useSearchParams` |
| `FilterListContainer` | server | Build initial `serverFilters` from ES; pass `serverSearch`; mount `FilterListReactive` | `filtersDataPromise` |
| `FiltersWindow` | client | Seed `search_text` from `serverSearch`/live `?search=` so modal facets are search-scoped | `GetFilters` (existing) |
| `SearchBoutiquePage` | client | Mirror committed `?search=` into the box when unfocused | `useSearchParams` (existing) |
