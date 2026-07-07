# Listing Search ↔ Filter Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the listing filter surfaces react to a typed `?search=` — filter circles/price ranges re-scope to the search (focus-safe, client-side), the search shows as an individually-removable active chip, clear-all drops the search, and the FiltersWindow modal's facets are search-scoped.

**Architecture:** Extend the `?search=` refactor's "server-seeded, client-reactive" pattern (already used by `SortableGrid` for the grid) to the filter list. A new client controller (`FilterListReactive`) compares the live `?search=` to what the server rendered (`serverSearch`); while they match it shows the server-rendered filter data, and when they differ it debounce-refetches the aggregations via the existing `GetFilters` server action and re-renders the (now client) `FilterList` with the fresh data + live search. The active-filters bar renders the search chip from an explicit `searchText` prop and gains a ✕ that clears only `?search=`.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), React 19, Zustand 5, TailwindCSS 4, Elasticsearch. Spec: `docs/superpowers/specs/2026-07-06-listing-search-filter-sync-design.md`.

## Global Constraints

- **No test suite.** This repo has no tests and forbids adding them (CLAUDE.md). "Verify" steps use `npx tsc --noEmit` (types), `pnpm lint`, `pnpm build` (server/client-boundary + final), and manual browser checks. `tsc` alone does **not** catch a server-component-importing-a-client violation — `pnpm build` is the authoritative check for boundary tasks.
- **Commit to `develop`** directly (matches the `?search=` refactor's convention: "keep in develop"). No feature branch. End every commit message with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Package manager: pnpm.** Path aliases: `@/*`, `services/*`, `components/*`, `store`, `serverRequests/*`, `utils/*` all resolve from repo root.
- **`?search=` is the single source of truth** for committed search. Filter **toggles** keep it (already implemented in `getFilterStateForItem` via `activeQueryString`); only **clear-all** and the **chip-✕** remove it.
- **Debounce the filter refetch = 400 ms** (matches the FiltersWindow modal's existing `UpdateFilters` debounce). No skeleton on refetch — the in-input spinner (`store.searchLoading`) is the progress signal.
- **Uniform across three routes:** `filters`, `featured`, `flashDeals` render the same filter list + modal and must behave identically.
- **Store devtools** middleware is dev-only and already configured in `store/index.ts` — do not add it in component files.
- **`utils/server` is client-safe** — `components/ListingPage/FilterItem.tsx` (already `"use client"`) imports from it and builds; so making `FilterList` a client component and importing the same helpers is safe.

---

### Task 1: `FilterList` → client component with a reactive search chip

Make `FilterList` (and its in-file `ActiveFiltersBar` / `FilterItemsRow`) a client component that renders the active-search chip from an explicit `searchText` prop, gives the chip a ✕ that clears only `?search=`, keeps the global reset dropping search, and forwards the search into the "load more filters" paging. No behavior change yet on the page (callers still pass no `searchText`, so `searchText` defaults to `""` → chip hidden, exactly as today).

**Files:**
- Modify: `components/Server/FilterList.tsx`

**Interfaces:**
- Consumes: nothing new from earlier tasks.
- Produces: `FilterList` now accepts `searchText?: string`. `ActiveFiltersBar` now accepts `searchText?: string` and renders/removes the search chip from it. Both are consumed by `FilterListReactive` (Task 2).

- [ ] **Step 1: Make the file a client module and add navigation hooks**

At the very top of `components/Server/FilterList.tsx`, add the `"use client"` directive (line 1, before the `import React` line) and add the navigation hooks import after the existing `next/image` import:
```tsx
"use client";
import React from "react";
```
And after `import Image from "next/image";` add:
```tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Accept `searchText` on `FilterList` and forward search into paging**

Change the `FilterList` destructure (currently `parsedFilters, params, filters, currency, isFeatured, isFlashDeals, itemsLength`) to add `searchText`:
```tsx
function FilterList({
  parsedFilters,
  params,
  filters,
  currency,
  isFeatured,
  isFlashDeals,
  itemsLength,
  searchText = "",
}: any) {
```
Immediately after `const isUsingParsedFilters = Boolean(parsedFilters);` add a paging-scoped filter object that carries the search so `GetNextPageFilters` ("More from…") stays scoped to the search:
```tsx
  // "Load more filters" (InfiniteScrollFilters → GetNextPageFilters) must page
  // within the active search. buildParamsFromFilters/getFilterStateForItem ignore
  // search_text, and FilterItem reads the live query itself, so adding it here only
  // scopes the paging fetch — it does not affect chip hrefs or active state.
  const filterParamsForPaging = searchText
    ? { ...parsedFilters, search_text: [searchText] }
    : parsedFilters;
```
In the `.map` that renders `<FilterItemsRow .../>`, change `filterParams={filterParams}` to `filterParams={filterParamsForPaging}`.

- [ ] **Step 3: Pass `searchText` to `ActiveFiltersBar`**

Change the `<ActiveFiltersBar .../>` usage at the end of `FilterList` to add the prop:
```tsx
      <ActiveFiltersBar
        params={params}
        currency={currency}
        filterParams={parseFiltersFunction()}
        isUsingParsedFilters={isUsingParsedFilters}
        filters={filters}
        searchText={searchText}
      />
```

- [ ] **Step 4: Teach `ActiveFiltersBar` to render + remove the search chip**

In `interface ActiveFiltersBarProps`, add:
```tsx
  searchText?: string;
```
Change the `ActiveFiltersBar` destructure to accept it:
```tsx
const ActiveFiltersBar = ({
  currency,
  filterParams,
  isUsingParsedFilters,
  filters,
  params,
  searchText = "",
}: ActiveFiltersBarProps) => {
```
At the top of the component body (right after that destructure), add the navigation hooks + a search-remover:
```tsx
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Chip ✕: clear ONLY ?search= (keep path filters + other query params like sort).
  const removeSearch = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("search");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
```

- [ ] **Step 5: Make the empty-bar guards account for the search chip**

Replace the early return at (currently) `if (activeFilters && Object.keys?.(activeFilters)?.length === 0) return <></>;` with a guard that keeps the bar when only a search is active:
```tsx
  const hasAnyActiveFilter = Object.keys(activeFilters).some(
    (key) => activeFilters[key]?.length > 0,
  );
  if (!hasAnyActiveFilter && !(searchText?.length > 0)) return <></>;
```
And change the single-boutique short-circuit so a search still shows the bar. Replace:
```tsx
  if (hasOnlyOneBoutique && otherFiltersCount === 0) {
    return <></>;
  }
```
with:
```tsx
  if (hasOnlyOneBoutique && otherFiltersCount === 0 && !(searchText?.length > 0)) {
    return <></>;
  }
```

- [ ] **Step 6: Render the search chip from `searchText` with a ✕**

Replace the existing search-chip block (the `{activeFilters?.search_text?.length > 0 && ( … )}` block near the end of `ActiveFiltersBar`) with one driven by `searchText`, including a remove control:
```tsx
      {searchText?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          <span>
            <img src="/icons/Search.svg" className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title text-[#5d5d5d]">
            {typeof searchText === "string" ? pollinateInput(searchText) : ""}
          </div>
          <img
            src="/icons/CloseIcon.svg"
            data-cy="removeSearchChip"
            className="ml-1 scale-90"
            onClick={(e) => {
              e.stopPropagation();
              removeSearch();
            }}
          />
        </>
      )}
```

- [ ] **Step 7: Note the reset already drops search (comment only)**

Right above `const getResetUrl = () => {`, add a comment so this invariant is not accidentally broken later:
```tsx
  // Global clear-all: getResetUrl() returns a clean PATH with no query string, so
  // it inherently drops ?search= (Req 2). Never append the active query here.
```

- [ ] **Step 8: Verify types + lint + build (boundary)**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `pnpm lint`
Expected: no new errors.
Run: `pnpm build`
Expected: build succeeds (this is the authoritative check that turning `FilterList` into a client component did not break the `FilterListContainer` server→client boundary). Load `/en-gb/filters` — the filter list + active bar render exactly as before (no `searchText` passed yet, so no search chip).

- [ ] **Step 9: Commit**

```bash
git add components/Server/FilterList.tsx
git commit -m "feat(listing): FilterList client component with reactive search chip (searchText prop, chip ✕)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `FilterListReactive` — client controller that refetches filters on `?search=`

Add the controller that watches `?search=`, and when it differs from the server's, debounce-refetches the aggregations via `GetFilters` and renders `FilterList` with the fresh data + live search. While they match (no search / path-tap / shared link), it renders the server-provided data untouched.

**Files:**
- Create: `components/Server/FilterListReactive.tsx`

**Interfaces:**
- Consumes: `FilterList` + its `searchText` prop (Task 1); `GetFilters` (`serverRequests/listing`, existing) which returns `{ categories, brands, colors, sizes, prices, total_size }` where `prices` is the full facet object (`prices.priceRanges` is the array).
- Produces: `FilterListReactive` default export with props `{ serverFilters, serverSearch?, parsedFilters, params, currency, isFeatured?, isFlashDeals?, itemsLength }`. Consumed by `FilterListContainer` (Task 3).

- [ ] **Step 1: Create the controller**

Create `components/Server/FilterListReactive.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GetFilters } from "serverRequests/listing";
import { LogError } from "utils/functions";
import FilterList from "./FilterList";

/**
 * FilterListReactive — client controller for the in-page filter list.
 *
 * The server renders the filter aggregations once (serverFilters), scoped to the
 * search it rendered with (serverSearch). A typed search commits ?search= without a
 * server re-render (staleTimes reuses the RSC), so here we watch the live ?search=:
 * while it equals serverSearch we show the server data; the moment it differs we
 * debounce-refetch the aggregations client-side (GetFilters) and render FilterList
 * with the fresh facets + the live search. Focus-safe: no full reload, no skeleton
 * (the in-input spinner is the progress signal). A filter TAP is a path navigation
 * that re-renders the server WITH ?search=, so afterwards live === serverSearch and
 * this controller goes dormant — grid, filters, and chip stay consistent.
 */
export default function FilterListReactive({
  serverFilters,
  serverSearch = "",
  parsedFilters,
  params,
  currency,
  isFeatured = false,
  isFlashDeals = false,
  itemsLength,
}: {
  serverFilters: any;
  serverSearch?: string;
  parsedFilters: any;
  params: any;
  currency: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  itemsLength: number;
}) {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const isSearchDifferent = searchParam !== serverSearch;

  const [country, language] = params.lang.split("-");

  // Refetched facets + total for the current typed search (null ⇒ show server data).
  const [refetched, setRefetched] = useState<any | null>(null);
  const [refetchedTotal, setRefetchedTotal] = useState<number>(itemsLength);
  const latestReqRef = useRef(0);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    // Back on the server's search → drop the client facets, show the server grid.
    if (!isSearchDifferent) {
      setRefetched(null);
      return;
    }
    const reqId = ++latestReqRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await GetFilters({
          country,
          language,
          filter_offset: 1,
          filters: {
            ...parsedFilters,
            featured: isFeatured || undefined,
            flashdeal: isFlashDeals || undefined,
            search_text: searchParam || undefined,
          },
        });
        if (reqId !== latestReqRef.current) return; // stale response, ignore
        if (!res) return;
        setRefetched({
          categories: res.categories ?? [],
          brands: res.brands ?? [],
          colors: res.colors ?? [],
          sizes: res.sizes ?? [],
          prices: res.prices?.priceRanges ?? [],
          boutiques: serverFilters?.boutiques ?? [],
          related_categories: [],
          search_text: searchParam || null,
        });
        setRefetchedTotal(res.total_size ?? 0);
      } catch (error) {
        if (reqId === latestReqRef.current) {
          LogError({ error, scenario: "FilterListReactive GetFilters" });
        }
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    isSearchDifferent,
    searchParam,
    country,
    language,
    isFeatured,
    isFlashDeals,
    parsedFilters,
    serverFilters,
  ]);

  const useRefetched = isSearchDifferent && refetched;
  const effectiveFilters = useRefetched ? refetched : serverFilters;
  const effectiveSearch = isSearchDifferent ? searchParam : serverSearch;
  const effectiveItemsLength = useRefetched ? refetchedTotal : itemsLength;

  return (
    <FilterList
      filters={effectiveFilters}
      parsedFilters={parsedFilters}
      params={params}
      currency={currency}
      isFeatured={isFeatured}
      isFlashDeals={isFlashDeals}
      itemsLength={effectiveItemsLength}
      searchText={effectiveSearch}
    />
  );
}
```

- [ ] **Step 2: Verify types + lint + build**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `pnpm lint`
Expected: no new errors.
Run: `pnpm build`
Expected: succeeds. (Not mounted yet — this just verifies the new client module compiles and imports resolve.)

- [ ] **Step 3: Commit**

```bash
git add components/Server/FilterListReactive.tsx
git commit -m "feat(listing): FilterListReactive controller (debounced GetFilters refetch on ?search=)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Mount `FilterListReactive` + thread `serverSearch` from the three pages

Swap `FilterListContainer` to render `FilterListReactive` (server-seeded), and thread the page's `effectiveSearch` into it. This activates Req 1 (filters re-scope on typed search) and Req 3 (search chip shows) end-to-end.

**Files:**
- Modify: `components/Server/FilterListContainer.tsx`
- Modify: `components/Listing/FiltersPageContent.tsx:241-246`
- Modify: `app/(client)/[lang]/featured/[[...filters]]/page.tsx:180-185`
- Modify: `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (same `FilterListContainer` usage)

**Interfaces:**
- Consumes: `FilterListReactive` (Task 2).
- Produces: `FilterListContainer` gains a `serverSearch?: string` prop and mounts `FilterListReactive`.

- [ ] **Step 1: `FilterListContainer` renders `FilterListReactive`**

In `components/Server/FilterListContainer.tsx`, replace the `import FilterList from "./FilterList";` line with:
```tsx
import FilterListReactive from "./FilterListReactive";
```
Add `serverSearch = ""`, `isFeatured = false`, `isFlashDeals = false` to the destructured params:
```tsx
async function FilterListContainer({
  filtersPromis,
  Params,
  parsedFilters,
  currencyPromise,
  serverSearch = "",
  isFeatured = false,
  isFlashDeals = false,
}) {
```
Replace the `<FilterList .../>` element (inside the returned `<Suspense>`) with `<FilterListReactive .../>`:
```tsx
        <FilterListReactive
          serverFilters={filters}
          serverSearch={serverSearch}
          itemsLength={filtersData.products?.length ?? 0}
          currency={currency}
          key={`filter-list-filters`}
          params={Params}
          parsedFilters={parsedFilters}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
        />
```
> `isFeatured`/`isFlashDeals` are required so the client refetch (`GetFilters`) stays scoped to the `featured`/`flashDeals` route — `parsedFilters` on those routes does **not** carry the `featured`/`flashdeal` flag (the page adds it only in its own ES call). The `filters` route passes neither (both default `false`).

- [ ] **Step 2: Pass `serverSearch` from the `filters` route**

In `components/Listing/FiltersPageContent.tsx`, in the `categoryFilters` slot, add `serverSearch` to `<FilterListContainer .../>`:
```tsx
              <FilterListContainer
                filtersPromis={filtersDataPromise}
                currencyPromise={currencyPromise}
                Params={Params}
                parsedFilters={parsedFilters}
                serverSearch={effectiveSearch}
              />
```

- [ ] **Step 3: Pass `serverSearch` from `featured` + `flashDeals`**

In `app/(client)/[lang]/featured/[[...filters]]/page.tsx`, add `serverSearch` + `isFeatured` to the `<FilterListContainer .../>` usage:
```tsx
            <FilterListContainer
              filtersPromis={filtersData}
              currencyPromise={currency}
              Params={Params}
              parsedFilters={parsedFilters}
              serverSearch={effectiveSearch}
              isFeatured={true}
            />
```
In `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (it already computes `effectiveSearch` the same way), add `serverSearch={effectiveSearch}` and `isFlashDeals={true}` to its `<FilterListContainer .../>` usage.

- [ ] **Step 4: Verify types + lint + build**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `pnpm lint`
Expected: no new errors (confirm the removed `FilterList` import didn't leave a dangling reference).
Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Manual verification (the core behavior)**

`pnpm dev`, then on `/en-gb/filters`:
- Type "nike" in the search box → after ~1.5s the URL becomes `…?search=nike`, the grid swaps to results (existing), and within ~400ms the **filter circles + price ranges re-scope** to what's available in the nike results; a **"nike" search chip** appears in the active-filters bar; the box keeps focus while typing.
- Tap a filter circle (e.g. a category) while "nike" is active → navigates to the path carrying `?search=nike`; grid, filter circles, and chip stay consistent (server-rendered scoped to both).
- Tap the search chip **✕** → only the search clears (path filters remain); circles + grid return to the filter-only result set.
- Repeat the first bullet on `/en-gb/featured` and `/en-gb/flashDeals`, and once RTL on `/sy-ar/filters`.

- [ ] **Step 6: Commit**

```bash
git add components/Server/FilterListContainer.tsx components/Listing/FiltersPageContent.tsx "app/(client)/[lang]/featured/[[...filters]]/page.tsx" "app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx"
git commit -m "feat(listing): mount FilterListReactive + thread serverSearch (filters re-scope on ?search=, search chip shows)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: FiltersWindow modal facets scoped to the active search

Thread the effective search into the full-screen filter modal so its `GetFilters` calls are search-scoped. The modal already sends `{ ...selectedChips, prices }` to `GetFilters`; we only need to seed `selectedChips.search_text` from the search.

**Files:**
- Modify: `components/Server/FilterWidgetServer.tsx`
- Modify: `components/ListingPage/filterComponents/FiltersWindow/index.tsx`
- Modify: `components/Listing/FiltersPageContent.tsx` (FilterWidgetServer usage)
- Modify: `app/(client)/[lang]/featured/[[...filters]]/page.tsx` (FilterWidgetServer usage)
- Modify: `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (FilterWidgetServer usage)

**Interfaces:**
- Consumes: nothing from earlier tasks (independent surface).
- Produces: `FilterWidgetServer` + `FiltersWindow` gain `serverSearch?: string`.

- [ ] **Step 1: `FilterWidgetServer` forwards `serverSearch`**

In `components/Server/FilterWidgetServer.tsx`, add `serverSearch = ""` to the destructure:
```tsx
async function FilterWidgetServer({
  currencyPromise,
  filtersPromise,
  parsedFilters,
  country,
  language,
  isFeatured,
  isFlashDeal,
  serverSearch = "",
}) {
```
Add the prop to `<FiltersWindow ...>`:
```tsx
      <FiltersWindow
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
        currency={currency}
        language={language}
        country={country}
        serverSearch={serverSearch}
        initialFilters={parsedFilters}
```

- [ ] **Step 2: `FiltersWindow` seeds `search_text` from the search**

In `components/ListingPage/filterComponents/FiltersWindow/index.tsx`, import `useSearchParams` (add to the existing imports at the top):
```tsx
import { useSearchParams } from "next/navigation";
```
Add `serverSearch` to both the `FiltersWindow` and `FiltersWindowUI` param lists (each currently ends with `isFlashDeal,`):
```tsx
  isFlashDeal,
  serverSearch = "",
```
and pass it through in `FiltersWindow`'s `<FiltersWindowUI ...>`:
```tsx
      <FiltersWindowUI
        country={country}
        initialFilters={initialFilters}
        currency={currency}
        language={language}
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
        serverSearch={serverSearch}
      >
```
Inside `FiltersWindowUI`, right after the `const filterEnabled = ...` / `const setFilterEnabled = ...` lines, read the live search:
```tsx
  const searchParams = useSearchParams();
  const liveSearch = searchParams.get("search") || "";
```
Change the `search_text` seed inside `initialSelectedChips` (currently `search_text: initialFilters?.search_text ?? ""`) to prefer the live/served search as a **string**:
```tsx
      search_text:
        liveSearch || serverSearch || initialFilters?.search_text?.[0] || "",
```
Add `liveSearch` and `serverSearch` to that `useMemo`'s dependency array (currently `[initialFilters]`):
```tsx
    [initialFilters, liveSearch, serverSearch],
  );
```

- [ ] **Step 3: Pass `serverSearch` to `FilterWidgetServer` from all three pages**

In `components/Listing/FiltersPageContent.tsx`, add to `<FilterWidgetServer .../>`:
```tsx
          <FilterWidgetServer
            isFeatured={false}
            isFlashDeal={false}
            currencyPromise={currencyPromise}
            language={language}
            country={country}
            parsedFilters={parsedFilters}
            filtersPromise={filtersDataPromise}
            serverSearch={effectiveSearch}
          />
```
In `app/(client)/[lang]/featured/[[...filters]]/page.tsx`, add `serverSearch={effectiveSearch}` to its `<FilterWidgetServer .../>` (after `filtersPromise={filtersData}`). Apply the **identical** edit to `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx`.

- [ ] **Step 4: Verify types + lint + build**

Run: `npx tsc --noEmit` → clean.
Run: `pnpm lint` → no new errors.
Run: `pnpm build` → succeeds.

- [ ] **Step 5: Manual verification**

`pnpm dev`, on `/en-gb/filters`: type "nike" → open the full-screen filter modal (filter icon) → its category/brand/color/size chips and totals reflect the nike result set (not the unscoped catalog). Close, clear the search → reopen → modal shows the full catalog again.

- [ ] **Step 6: Commit**

```bash
git add components/Server/FilterWidgetServer.tsx components/ListingPage/filterComponents/FiltersWindow/index.tsx components/Listing/FiltersPageContent.tsx "app/(client)/[lang]/featured/[[...filters]]/page.tsx" "app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx"
git commit -m "feat(listing): scope FiltersWindow modal facets to the active ?search=

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Search box mirrors committed `?search=` when unfocused

So the chip-✕ and clear-all flow back into the search box (empty it), without ever yanking the caret mid-type.

**Files:**
- Modify: `components/filterPage/SearchBoutiquePage.tsx`

**Interfaces:**
- Consumes: the chip-✕ / clear-all URL edits (Tasks 1/3) — this task reacts to `?search=` changing.
- Produces: no new exports.

- [ ] **Step 1: Add the unfocused-sync effect**

In `components/filterPage/SearchBoutiquePage.tsx`, add this effect right after the existing "Publish expand state" effect (`useEffect(() => { setSearchExpanded(expanded); }, …)`):
```tsx
  // Mirror the committed ?search= into the box while NOT focused, so removing the
  // search (chip ✕ / clear-all) empties the box. While focused (mid-typing) local
  // state wins — never move the caret.
  useEffect(() => {
    if (focused) return;
    const committed = searchParams.get("search") || "";
    setValue((prev) => (prev === committed ? prev : committed));
  }, [searchParams, focused]);
```

- [ ] **Step 2: Verify types + lint + build**

Run: `npx tsc --noEmit` → clean.
Run: `pnpm lint` → no new errors.
Run: `pnpm build` → succeeds.

- [ ] **Step 3: Manual verification**

`pnpm dev`, on `/en-gb/filters`: type "nike" (commits), then tap the search chip **✕** → the search box empties and collapses; type "nike" again then tap clear-all (bar reset) → box empties. While actively typing, the caret never jumps.

- [ ] **Step 4: Commit**

```bash
git add components/filterPage/SearchBoutiquePage.tsx
git commit -m "feat(listing): search box mirrors committed ?search= when unfocused (chip/clear-all empties box)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full-flow verification pass

A final integration check across all routes/locales and a clean production build. No code changes unless a check fails (if one does, return to the owning task).

**Files:** none (verification only).

- [ ] **Step 1: Clean build**

Run: `pnpm build`
Expected: succeeds with no server/client boundary errors.

- [ ] **Step 2: Cross-route + locale manual matrix**

`pnpm dev`, verify each on `/en-gb/filters`, `/en-gb/featured`, `/en-gb/flashDeals`, and RTL `/sy-ar/filters`:
1. Type a search → filter circles + price ranges re-scope; search chip appears; grid updates; box keeps focus; no full reload.
2. Tap a filter while searching → server re-renders scoped to both; circles/grid/chip consistent.
3. Chip ✕ → only search clears; other filters remain; box empties.
4. Clear-all (bar reset) → everything clears incl. search; box empties.
5. Open FiltersWindow modal while searching → facets/totals reflect the search.
6. Shared link `…/filters?search=nike` → chip shows and filters are scoped on first paint.
7. Gibberish query with no matches → grid shows "No products found", the sort/filter/share trio hides (existing empty-gate), the search chip still shows so the user can remove it.

- [ ] **Step 3: Update the design doc status**

In `docs/superpowers/specs/2026-07-06-listing-search-filter-sync-design.md`, change `**Status:** Approved (pending written-spec review)` to `**Status:** Implemented`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-06-listing-search-filter-sync-design.md
git commit -m "docs(listing): mark search ↔ filter sync design implemented

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **Boundary risk is the main one.** Task 1 turns `FilterList` from a server into a client component. `tsc` won't catch a boundary regression — `pnpm build` is the gate. It should pass because `FilterItem` already imports the same `utils/server` helpers client-side today.
- **Why no skeleton on the filter refetch:** the design deliberately keeps the in-input spinner as the only progress signal during a typed search; the filter list shows its last-known facets until the 400ms-debounced `GetFilters` resolves.
- **Dormant-on-path-tap is load-bearing:** after a filter tap, the server re-renders with `?search=` in the URL, so `searchParam === serverSearch` and `FilterListReactive` shows server data — do not add logic that refetches when they're equal.
- **`prices` shape:** `GetFilters` returns `prices` as the full facet object; the in-page circles need the array, so `FilterListReactive` maps `res.prices?.priceRanges ?? []` (matches how `FilterListContainer` builds `filters.prices`).
