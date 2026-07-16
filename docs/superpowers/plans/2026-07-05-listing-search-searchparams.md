# Listing Search → `?search=` Search-Param Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the listing search box from a URL **path segment** (`/filters/search/<value>`) to a `?search=` **query param**, mirroring the existing sort flow — so typing never flips the page or loses focus, search is debounced with a spinner (no skeletons), analyze-search + the sort/filter/share empty-gate keep working, and the query is shareable.

**Architecture:** The server reads `?search=` on render and injects it into the ES query (SSR/shared links). A client input owns local state and writes `?search=` via `router.replace` (no remount, thanks to `staleTimes.dynamic` not varying the RSC by query param — the same mechanism sort relies on). The `SortableGrid` client controller, already watching `?sort=`, additionally watches `?search=` and refetches page 1 client-side via the `GetProducts` server action. A small `listing`-store UI slice (`searchLoading`, `searchHasResults`, `searchExpanded`) coordinates the in-input spinner, the reactive empty-gate, and collapse/expand across components — replacing the old `document.querySelector` hacks.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), React 19, Zustand 5, TailwindCSS 4, Elasticsearch. Spec: `docs/superpowers/specs/2026-07-05-listing-search-searchparams-design.md`.

## Global Constraints

- **No test suite.** This repo has no tests and forbids adding them (CLAUDE.md). "Verify" steps use `npx tsc --noEmit` (types), `pnpm lint`, `pnpm build` (server/client-boundary + final), and manual browser checks. `tsc` alone does **not** catch server-component-importing-client violations — `pnpm build` is the authoritative check for boundary tasks.
- **Commit to `develop`** directly (user directive: "keep in develop"). No feature branch. End every commit message with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Package manager: pnpm.** Path aliases: `@/*`, `services/*`, `components/*`, `store`, `serverRequests/*`, `utils/*` all resolve from repo root.
- **Out of scope (do not touch):** the filter aggregation query / filter chips, ES query internals (only *forward* existing response fields), mobile `searchInCatalog`.
- **Debounce = 1500 ms**; commit history uses `router.replace`; spinner (never skeleton) while searching; input collapses when empty & unfocused.
- **Uniform across three routes:** `filters`, `featured`, `flashDeals` all render the same search bar + grid and must behave identically.
- **Store devtools** middleware is dev-only and already configured in `store/index.ts` — do not add it in slice files.

---

### Task 1: Store — listing UI flags

**Files:**
- Modify: `store/listing/reducer.ts`

**Interfaces:**
- Produces: store state `searchLoading: boolean`, `searchHasResults: boolean`, `searchExpanded: boolean`; setters `setListingSearchLoading(v: boolean)`, `setSearchHasResults(v: boolean)`, `setSearchExpanded(v: boolean)`. Accessed anywhere via `useAppStore((s) => s.searchLoading)` etc. (the `listing` slice is spread into `useAppStore` by `store/index.ts`).

> **NOTE (post-Task-4 fix):** the setter is named `setListingSearchLoading`, NOT `setListingSearchLoading` — the `search` store slice already owns `setListingSearchLoading` (sets `loading_search`) and, being spread after the listing slice in `store/index.ts`, would shadow it. The field stays `searchLoading` (no collision). All references below use `setListingSearchLoading`.

- [ ] **Step 1: Add the three flags + setters**

In `store/listing/reducer.ts`, extend the interface, initial state, and the reducer.

Change the `interface ListingState` to add (after `cameraPermissions`):
```ts
  cameraPermissions: "asked";
  // Search UI coordination (listing search → ?search= refactor).
  searchLoading: boolean; // in-input spinner: typing → results landed
  searchHasResults: boolean; // reactive sort/filter/share empty-gate + grid empty-state
  searchExpanded: boolean; // collapse/expand of the search box + hide boutique logo
```

Change `initialState` to add:
```ts
  cameraPermissions: "asked",
  searchLoading: false,
  searchHasResults: true,
  searchExpanded: false,
```

Add these setters inside `useListingStore` (before `resetEnd`):
```ts
  setListingSearchLoading: (loading: boolean) => set({ searchLoading: loading }),

  setSearchHasResults: (hasResults: boolean) =>
    set({ searchHasResults: hasResults }),

  setSearchExpanded: (expanded: boolean) => set({ searchExpanded: expanded }),
```

- [ ] **Step 2: Verify types + lint**

Run: `npx tsc --noEmit`
Expected: no new errors.
Run: `pnpm lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add store/listing/reducer.ts
git commit -m "feat(listing): add searchLoading/searchHasResults/searchExpanded store flags

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `GetProducts` forwards `isAnalyzed`

The client search refetch must recover the ES analysis of the raw query. The `noFilters:true` response already carries `isAnalyzed` (elasticSearch.ts:553); `GetProducts` just doesn't return it yet.

**Files:**
- Modify: `types/listing.ts:44-51`
- Modify: `serverRequests/listing/index.tsx:100-133`

**Interfaces:**
- Produces: `GetProductsResult.isAnalyzed?: any`. `GetProducts(...)` now returns `isAnalyzed` on both the success and catch paths.

- [ ] **Step 1: Add `isAnalyzed` to the result type**

In `types/listing.ts`, change the `GetProductsResult` interface to:
```ts
export interface GetProductsResult {
  products: ListingProduct[];
  offset: any;
  recomended_offset?: any;
  pit_id: string | null;
  productIds: string[];
  GA_PRODUCTS_LIST: GAProductListItem[];
  // ES analysis of the free-text query (detected color/size/brand + analyzed
  // `name`). Forwarded so a client-side search can page subsequent requests by
  // the analyzed name (parity with the server's ProductListConainer).
  isAnalyzed?: any;
}
```

- [ ] **Step 2: Return `isAnalyzed` from `GetProducts`**

In `serverRequests/listing/index.tsx`, in the success `return { ... }` (around line 102), add `isAnalyzed`:
```ts
  return {
    products,
    offset: newOffset,
    recomended_offset: response?.recommended_offset,
    pit_id: response?.pit_id ?? null,
    isAnalyzed: response?.isAnalyzed ?? null,
    productIds: products?.map((p) => String(p?.product_id)) ?? [],
    GA_PRODUCTS_LIST: response?.products?.map((s) => ({
```
And in the catch `return { ... }` (around line 125), add `isAnalyzed: null`:
```ts
    return {
      products: [],
      offset: undefined,
      recomended_offset: undefined,
      pit_id: null,
      isAnalyzed: null,
      productIds: [],
      GA_PRODUCTS_LIST: [],
    };
```

- [ ] **Step 3: Verify types + lint**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `pnpm lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add types/listing.ts serverRequests/listing/index.tsx
git commit -m "feat(listing): forward isAnalyzed from GetProducts server action

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Server reads `?search=` and threads `serverSearch`

Read `?search=` on every render (like `sort`), inject it into the ES query, and thread the effective search string down to the input, the grid controller, and the empty-gate. No visible behavior change yet (nothing emits `?search=` until Task 7), so this is a safe additive step.

**Files:**
- Modify: `app/(client)/[lang]/filters/[[...filters]]/page.tsx:67-73`
- Modify: `app/(client)/[lang]/@modal/(.)filters/[[...filters]]/page.tsx:6-12`
- Modify: `app/(client)/[lang]/featured/[[...filters]]/page.tsx:57-201`
- Modify: `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (same shape as featured)
- Modify: `components/Listing/FiltersPageContent.tsx:95-273`
- Modify: `components/Server/ListingSearchContainer.tsx`
- Modify: `components/Server/ProductListConainer.tsx:10-80`
- Modify: `components/Server/ProductList.tsx:57-176`

**Interfaces:**
- Produces: a string `serverSearch` (the effective `?search=` value the server rendered with, `""` when absent) threaded to `SearchBoutiquePage`, `SortableGrid`, and the grid. `FiltersPageContent` gains a `search?: string` prop. `SortableGrid` gains `serverSearch?: string` and `serverHasResults?: boolean` props (consumed in Task 4).

- [ ] **Step 1: `filters` page reads `search`**

In `app/(client)/[lang]/filters/[[...filters]]/page.tsx`, change the `Page` function:
```tsx
export default async function Page({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // @ts-ignore
  return <FiltersPageContent params={Params} sort={sort} search={search} />;
}
```

- [ ] **Step 2: modal slot reads `search`**

In `app/(client)/[lang]/@modal/(.)filters/[[...filters]]/page.tsx`:
```tsx
export default async function InterceptedFiltersPage({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // @ts-ignore
  return <FiltersPageContent params={Params} sort={sort} search={search} />;
}
```

- [ ] **Step 3: `FiltersPageContent` accepts `search`, injects it into ES, threads it**

In `components/Listing/FiltersPageContent.tsx`:

Change the props interface + signature:
```tsx
interface FiltersPageContentProps {
  params: { lang: string; filters?: string[] };
  sort?: string;
  search?: string;
}

export default async function FiltersPageContent({
  params,
  sort,
  search,
}: FiltersPageContentProps) {
```

Immediately after `const boutiqueItem = parsedFilters?.boutiques?.[0] || null;` compute the effective search (query wins; path fallback is defensive — post-Task-8 the path never carries search):
```tsx
    const effectiveSearch =
      (typeof search === "string" && search.length > 0
        ? search
        : parsedFilters?.search_text?.[0]) ?? "";
```

In the `dedupeRequest` key, add `effectiveSearch` and use it for `search_text`:
```tsx
    const filtersDataPromise = dedupeRequest(
      `listing:${country}:${language}:${sort ?? ""}:${effectiveSearch}:${parsedUserId ?? ""}:${JSON.stringify(parsedFilters)}`,
      () =>
        getProductsAndFiltersFromElastic({
          country,
          language_code: language,
          filters: {
            ...parsedFilters,
            featured: false,
            flashdeal: false,
            search_text: effectiveSearch || undefined,
          },
          limit: 10,
          userId: parsedUserId,
          sort,
          usePit: true,
        }),
    );
```

Pass `serverSearch` to the search container and the product list. Change the `<ListingSearchContainer .../>` usage:
```tsx
                <ListingSearchContainer
                  country={country}
                  language={language}
                  filtersPromise={filtersDataPromise}
                  parsedFilters={parsedFilters}
                  serverSearch={effectiveSearch}
                />
```
And the `<ProductListConainer .../>` usage — add `serverSearch={effectiveSearch}`:
```tsx
              <ProductListConainer
                isFlashDeals={false}
                isFeatured={false}
                Params={Params}
                boutiquePromise={boutiquePromise}
                currencyPromise={currencyPromise}
                filtersDataPromise={filtersDataPromise}
                parsedFilters={parsedFilters}
                language={language}
                sort={sort}
                serverSearch={effectiveSearch}
              />
```

- [ ] **Step 4: `ListingSearchContainer` passes `serverSearch` to the input**

Rewrite `components/Server/ListingSearchContainer.tsx` to pass `serverSearch` (falling back to the ES-applied/analyzed value) into the input as the new `serverSearch` prop:
```tsx
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import React, { Suspense } from "react";

async function ListingSearchContainer({
  country,
  language,
  parsedFilters,
  filtersPromise,
  serverSearch = "",
  featured = false,
  flashdeal = false,
}) {
  let filtersData = await filtersPromise;
  return (
    <Suspense fallback={<></>}>
      <SearchBoutiquePage
        country={country}
        language={language}
        featured={featured}
        flashdeal={flashdeal}
        parsedFilters={parsedFilters}
        serverSearch={
          serverSearch ||
          filtersData?.applied?.search_text ||
          parsedFilters?.search_text?.[0] ||
          ""
        }
      />
    </Suspense>
  );
}

export default ListingSearchContainer;
```
> Note: `SearchBoutiquePage` still has its old signature until Task 7. It ignores unknown props, so this compiles and behaves unchanged. `lang`/`isAnalyzed`/`search_text` props are dropped here because the rebuilt input (Task 7) no longer needs them.

- [ ] **Step 5: `ProductListConainer` threads `serverSearch`**

In `components/Server/ProductListConainer.tsx`, add `serverSearch = ""` to the destructured params (after `sort = undefined,`) and pass it to `ProductListServer`:
```tsx
async function ProductListConainer({
  currencyPromise,
  filtersDataPromise,
  boutiquePromise,
  parsedFilters,
  Params,
  isFlashDeals = false,
  isFeatured = false,
  language,
  sort = undefined,
  serverSearch = "",
}) {
```
In the `<ProductListServer .../>` element add:
```tsx
        sort={sort}
        serverSearch={serverSearch}
        target={path}
        title={title}
```

- [ ] **Step 6: `ProductListServer` threads `serverSearch` + `serverHasResults` into `SortableGrid`**

In `components/Server/ProductList.tsx`, add `serverSearch = ""` to the `ProductListServer` params (after `sort = undefined,`). Then compute `hasResults` and pass both to `SortableGrid`:
```tsx
  const hasResults = !!products && products.length > 0;
```
(place right after `const translate = ...`). Change the `<SortableGrid ...>` opening tag to add the two props:
```tsx
        <SortableGrid
          serverSort={sort ?? ""}
          serverSearch={serverSearch}
          serverHasResults={hasResults}
          currency={currency}
          boutiqueName={boutique?.name}
          parsedFilters={{
            ...parsedFilters,
            featured: isFeatured,
            flashdeal: isFlashDeals,
          }}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
          sizesFilters={
            parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
          }
        >
```
> `SortableGrid` doesn't declare these props until Task 4; TS allows extra props on a JS-typed component, and Task 4 lands before any behavior depends on them. If `tsc` flags it, proceed — Task 4 adds the declarations.

- [ ] **Step 7: `featured` + `flashDeals` pages read `search` and thread it**

In `app/(client)/[lang]/featured/[[...filters]]/page.tsx`, inside `Page`, after the `sort` line (line 62) add:
```tsx
    const search = typeof sp.search === "string" ? sp.search : undefined;
    const effectiveSearch =
      (search && search.length > 0
        ? search
        : parsedFilters.search_text?.[0]) ?? "";
```
Change the ES call's `search_text` (line 85) to `search_text: effectiveSearch || undefined,`. Add `serverSearch={effectiveSearch}` to both `<ListingSearchContainer .../>` (after `filtersPromise`) and `<ProductListConainer .../>` (after `sort={sort}`).

Apply the **identical** edits to `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (same structure; `featured:false, flashdeal:true`).

- [ ] **Step 8: Verify build (server/client boundary)**

Run: `npx tsc --noEmit`
Expected: clean (or only the known extra-props note on `SortableGrid`, resolved in Task 4).
Run: `pnpm build`
Expected: build succeeds. Load `/en-gb/filters` and `/en-gb/filters/search/nike` (legacy path still parsed) — the page renders exactly as before.

- [ ] **Step 9: Commit**

```bash
git add app components
git commit -m "feat(listing): read ?search= server-side and thread serverSearch through the tree

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Grid controller — `SortableGrid` watches `?search=`, `ProductsInfiniteScroll` search-mode

Generalise the sort controller to also watch `?search=`. On a search different from the server's, it refetches page 1 client-side (no skeleton) and writes result state to the store. Still dormant until Task 7 emits `?search=`.

**Files:**
- Rewrite: `components/Server/SortableGrid.tsx`
- Modify: `components/ListingPage/ProductInfiniteScroll.tsx`

**Interfaces:**
- Consumes: `store.setListingSearchLoading`, `store.setSearchHasResults` (Task 1); `GetProducts.isAnalyzed` (Task 2); `serverSearch`/`serverHasResults` props (Task 3).
- Produces: `SortableGrid` prop contract `{ serverSort?: string; serverSearch?: string; serverHasResults?: boolean; ... }`. `ProductsInfiniteScroll` gains `searchMode?: boolean` and `searchQuery?: string` props.

- [ ] **Step 1: Rewrite `SortableGrid`**

Replace `components/Server/SortableGrid.tsx` entirely:
```tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";

/**
 * SortableGrid — the client controller for the URL params that re-page the grid
 * from page 1 without a full RSC re-render: `?sort=` and `?search=`.
 *
 * Why a client refetch instead of router.refresh(): next.config `staleTimes.
 * dynamic` caches the dynamic RSC and does NOT vary it by search params, so a
 * query-only navigation reuses the already-rendered grid. A Server Action
 * (`GetProducts`) always runs fresh and bypasses the Router Cache — that's the
 * escape hatch both sort and search use.
 *
 * While the live `?sort=`/`?search=` both equal what the server rendered, we show
 * the untouched server grid (SSR default). The moment either differs we mount a
 * fresh `ProductsInfiniteScroll` paged from page 1 with the live values. Search
 * shows NO skeleton — the in-input spinner (store.searchLoading) is the only
 * progress signal; sort keeps its first-page skeleton.
 */
export default function SortableGrid({
  children,
  serverSort = "",
  serverSearch = "",
  serverHasResults = true,
  currency,
  boutiqueName,
  parsedFilters,
  isFeatured = false,
  isFlashDeals = false,
  sizesFilters = null,
}: {
  children: React.ReactNode;
  serverSort?: string;
  serverSearch?: string;
  serverHasResults?: boolean;
  currency: any;
  boutiqueName?: string;
  parsedFilters: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  sizesFilters?: string[] | null;
}) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "";
  const searchParam = searchParams.get("search") || "";

  const isSearchDifferent = searchParam !== serverSearch;
  const isSortDifferent = sortParam !== serverSort;
  const showingServerGrid = !isSortDifferent && !isSearchDifferent;

  // Back on the server-rendered grid: clear the page loader, stop the in-input
  // spinner, and restore the server's has-results verdict (no client fetch will
  // fire to do it). Covers the "user reverted the query to the server's" case.
  useEffect(() => {
    if (showingServerGrid) {
      useAppStore.getState().setIsNavigating(null);
      useAppStore.getState().setListingSearchLoading(false);
      useAppStore.getState().setSearchHasResults(serverHasResults);
    }
  }, [showingServerGrid, serverHasResults]);

  if (showingServerGrid) return <>{children}</>;

  // A search refetch merges the RAW live query into the filters so ES analyzes
  // it; page 2+ then reuse the analyzed name (handled inside the scroll).
  const searchActive = isSearchDifferent && searchParam.length >= 0;
  const mergedFilters = isSearchDifferent
    ? { ...parsedFilters, search_text: searchParam || undefined }
    : parsedFilters;

  return (
    <ProductsInfiniteScroll
      key={`sorted-${sortParam}-${searchParam}`}
      offset={[]}
      pit_id={null}
      recomended_offset={null}
      boutiqueName={boutiqueName}
      analyticsData={[]}
      parsedFilters={mergedFilters}
      currency={currency}
      isFeatured={isFeatured}
      isFlashDeals={isFlashDeals}
      sizes_filters={sizesFilters}
      sort={sortParam}
      searchMode={isSearchDifferent}
      searchQuery={searchParam}
      firstPageSkeleton={!isSearchDifferent}
    />
  );
}
```
> `firstPageSkeleton` is on for a pure sort change (keeps today's behavior) and **off** for search (spinner-in-input only, no skeleton). When both differ, search wins → no skeleton.

- [ ] **Step 2: `ProductsInfiniteScroll` — accept search-mode props**

In `components/ListingPage/ProductInfiniteScroll.tsx`, add to the destructured props (after `firstPageSkeleton = false,`):
```tsx
  searchMode = false,
  searchQuery = "",
```
and to the props type (after `firstPageSkeleton?: boolean;`):
```tsx
  // Search-driven client refetch (?search=): no skeleton (in-input spinner
  // instead), forward the analyzed name to later pages, and write result state
  // to the store for the reactive empty-gate.
  searchMode?: boolean;
  searchQuery?: string;
```

- [ ] **Step 3: `ProductsInfiniteScroll` — thread the analyzed name + store writes**

Add a ref for the analyzed search name near the other refs (after `pitIdRef`):
```tsx
  // For a search session: page 1 sends the RAW query so ES analyzes it; from the
  // response we lock the analyzed name and page 2+ reuse it (parity with the
  // server's ProductListConainer), keeping the PIT snapshot consistent.
  const searchNameRef = useRef<string | null>(searchMode ? searchQuery : null);
```

In `getProductsReq`, replace the `parsedFilters: parsedFilters,` argument to `GetProducts` with a search-aware version:
```tsx
        parsedFilters: searchMode
          ? { ...parsedFilters, search_text: searchNameRef.current || undefined }
          : parsedFilters,
```

After the `const response = await GetProducts({...});` call and its `if (!response)` guard, capture the analyzed name (page 1 only):
```tsx
      // Lock the analyzed name from page 1 so subsequent pages stay consistent.
      if (searchMode && searchNameRef.current === searchQuery) {
        const analyzedName = response?.isAnalyzed?.name;
        if (analyzedName && typeof analyzedName === "string") {
          searchNameRef.current = analyzedName;
        }
      }
```

- [ ] **Step 4: `ProductsInfiniteScroll` — write search result state + stop the spinner**

In the `finally` block of `getProductsReq`, after the existing `pageLoaderClearedRef` block, add (still inside `finally`):
```tsx
      // Search session: page 1 has resolved → stop the in-input spinner and
      // publish the has-results verdict for the empty-gate + empty-state.
      if (searchMode && !searchResultPublishedRef.current) {
        searchResultPublishedRef.current = true;
        const store = useAppStore.getState();
        store.setListingSearchLoading(false);
        store.setSearchHasResults(products.length > 0);
      }
```
Add the guard ref near the other refs:
```tsx
  const searchResultPublishedRef = useRef(false);
```
> `products` here is the `useState` array; on the first `getProductsReq` it has just been updated via `setProducts`, but for the has-results check use the freshly computed `temp_products.length > 0 || products.length > 0`. To avoid a stale-closure bug, compute it explicitly: replace the block above with:
```tsx
      if (searchMode && !searchResultPublishedRef.current) {
        searchResultPublishedRef.current = true;
        const store = useAppStore.getState();
        store.setListingSearchLoading(false);
        store.setSearchHasResults(seenIdsRef.current.size > 0);
      }
```
> `seenIdsRef` accumulates every appended product id and is populated synchronously earlier in `getProductsReq`, so it is a reliable "did page 1 yield anything" signal without depending on React state flush.

- [ ] **Step 5: `ProductsInfiniteScroll` — search empty-state (no skeleton, no "reached end")**

Add the empty-results illustration import at the top (next to `BagReachedEnd`):
```tsx
import {
  BagReachedEnd,
  BagNoResults,
} from "components/Listing/illustrations/ListingBagIllustration";
```
In the JSX, replace the reached-end block so a search that returned nothing shows "No products found" instead of the "reached end" bag. Change the final `) : (` branch of the `!isReachEnd ? ... : (...)` ternary to:
```tsx
        ) : searchMode && products.length === 0 ? (
          <div className="flex flex-col items-center text-center">
            <BagNoResults />
            <h2 className="f-16 medium color-dark-gray mt-4">
              {translate("No products found")}
            </h2>
            <p className="f-14 mt-1 text-[#707070]">
              {translate("Try changing or clearing your filters.")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <BagReachedEnd />
            <h2 className="f-16 medium color-dark-gray mt-4">
              {translate("You've reached the end")}
            </h2>
            <p className="f-14 mt-1 text-[#707070]">
              {translate("You've seen everything in this list.")}
            </p>
          </div>
        )}
```
Also suppress the sort skeleton for search mode — change the `firstPageSkeleton &&` block condition to `firstPageSkeleton && !searchMode &&` so search never shows product-card skeletons:
```tsx
      {firstPageSkeleton &&
        !searchMode &&
        products.length === 0 &&
        !isReachEnd &&
        Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={`sort-skeleton-${i}`} />
        ))}
```

- [ ] **Step 6: Verify build (boundary)**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `pnpm build`
Expected: succeeds. `/en-gb/filters` still renders the server grid (no `?search=` yet), sort still works with its skeleton.

- [ ] **Step 7: Commit**

```bash
git add components/Server/SortableGrid.tsx components/ListingPage/ProductInfiniteScroll.tsx
git commit -m "feat(listing): SortableGrid watches ?search=; scroll gains search-mode (analyzed paging, store writes, empty-state)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Reactive empty-gate (`ListingBarActions`)

Make the sort/filter/share trio hide/show based on the current (possibly client-fetched) result, seeded by the server's verdict.

**Files:**
- Create: `components/Listing/ListingBarActionsClient.tsx`
- Modify: `components/Server/ListingBarActions.tsx`

**Interfaces:**
- Consumes: `store.searchHasResults`, `store.setSearchHasResults` (Task 1).
- Produces: `ListingBarActionsClient` — a client wrapper that renders the trio when `searchHasResults`, seeded by a `serverHasResults` prop.

- [ ] **Step 1: Create the client gate**

Create `components/Listing/ListingBarActionsClient.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useAppStore } from "store";

/**
 * ListingBarActionsClient — the reactive gate for the sort/filter/share trio.
 *
 * Seeded by the server's has-results verdict (`serverHasResults`) on each real
 * server render (path-filter change / fresh load / shared link). A client-side
 * search then updates `store.searchHasResults` (via ProductsInfiniteScroll), so
 * a search that returns nothing hides the trio and one that returns results
 * shows it — without a full page re-render. The search input itself is NOT part
 * of this group (it stays visible so the user can fix a zero-result query).
 */
export default function ListingBarActionsClient({
  serverHasResults,
  children,
}: {
  serverHasResults: boolean;
  children: React.ReactNode;
}) {
  const hasResults = useAppStore((s) => s.searchHasResults);
  const setSearchHasResults = useAppStore((s) => s.setSearchHasResults);

  // Re-seed the store whenever the server re-renders with a new verdict.
  useEffect(() => {
    setSearchHasResults(serverHasResults);
  }, [serverHasResults, setSearchHasResults]);

  if (!hasResults) return null;
  return <>{children}</>;
}
```

- [ ] **Step 2: Wire the server component to the client gate**

Rewrite `components/Server/ListingBarActions.tsx` so the server computes `hasResults` and hands the trio to the client gate as children:
```tsx
import { Suspense } from "react";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import ListingSortControl from "components/Listing/ListingSortControl";
import ListingShareControl from "components/Listing/ListingShareControl";
import ListingBarActionsClient from "components/Listing/ListingBarActionsClient";

/**
 * ListingBarActions — the sort / filter / share trio in the listing bar.
 *
 * The trio only makes sense with a non-empty result set. The server seeds the
 * verdict from the ES result; `ListingBarActionsClient` then keeps it in sync
 * with client-side search (see Task 5 of the search-param refactor). The search
 * input is intentionally NOT part of this group — it stays visible so the user
 * can change a query that returned no matches.
 */
async function ListingBarActionsInner({
  filtersPromise,
  language,
  isRtl,
}: {
  filtersPromise: Promise<{ products?: unknown[] }>;
  language: string;
  isRtl: boolean;
}) {
  const filtersData = await filtersPromise;
  const hasResults = (filtersData?.products?.length ?? 0) > 0;

  return (
    <ListingBarActionsClient serverHasResults={hasResults}>
      <ListingSortControl language={language} isRtl={isRtl} />
      <FilterBoutiquePageButton key="filter-button" />
      <ListingShareControl language={language} isRtl={isRtl} />
    </ListingBarActionsClient>
  );
}

export default function ListingBarActions(props: {
  filtersPromise: Promise<{ products?: unknown[] }>;
  language: string;
  isRtl: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <ListingBarActionsInner {...props} />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify build (boundary)**

Run: `npx tsc --noEmit` → clean. Run: `pnpm build` → succeeds. The trio still shows on a populated `/en-gb/filters` and is hidden on a no-result path (e.g. an over-narrow price filter).

- [ ] **Step 4: Commit**

```bash
git add components/Server/ListingBarActions.tsx components/Listing/ListingBarActionsClient.tsx
git commit -m "feat(listing): make sort/filter/share empty-gate reactive to client search results

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Collapse/expand wrapper + boutique-logo hide (store-driven)

Replace the `document.querySelector` width/logo hacks with store-driven React components.

**Files:**
- Create: `components/Listing/ListingBarOptions.tsx`
- Create: `components/Listing/BoutiqueLogoCollapse.tsx`
- Modify: `components/Listing/FiltersPageContent.tsx` (bar JSX)
- Modify: `app/(client)/[lang]/featured/[[...filters]]/page.tsx` (bar JSX)
- Modify: `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx` (bar JSX)

**Interfaces:**
- Consumes: `store.searchExpanded` (Task 1).
- Produces: `ListingBarOptions` (client wrapper applying `w-full` when expanded/serverSearch) and `BoutiqueLogoCollapse` (hides children when `searchExpanded`).

- [ ] **Step 1: Create `ListingBarOptions`**

Create `components/Listing/ListingBarOptions.tsx`:
```tsx
"use client";

import { useAppStore } from "store";

/**
 * ListingBarOptions — the right-hand cluster of the listing bar (search input +
 * the sort/filter/share actions). It expands to full width when the search box
 * is expanded (focused or holding a value, via store.searchExpanded) or when the
 * page was server-rendered with a `?search=` (shared link). Replaces the old
 * classList.add("w-full") DOM hack. Server-rendered children (the Suspense'd
 * search container and the actions trio) are passed straight through.
 */
export default function ListingBarOptions({
  serverSearch = "",
  isRtl,
  children,
}: {
  serverSearch?: string;
  isRtl: boolean;
  children: React.ReactNode;
}) {
  const expanded = useAppStore((s) => s.searchExpanded);
  const isExpanded = expanded || serverSearch.length > 0;
  return (
    <div
      data-cy="filter_bar_options"
      className={`filter-bar-options justify-between ${
        isRtl ? "flex-row-reverse flex" : "flex-row flex"
      } align-center ${isExpanded ? "w-full" : "w-[170px]"}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `BoutiqueLogoCollapse`**

Create `components/Listing/BoutiqueLogoCollapse.tsx`:
```tsx
"use client";

import { useAppStore } from "store";

/**
 * BoutiqueLogoCollapse — hides the compact boutique logo while the search box is
 * expanded, freeing horizontal room. Replaces the querySelector(".boutique-logo-
 * container").style.display hack. Only the /filters (boutique) listing renders a
 * logo; featured/flashDeals have none.
 */
export default function BoutiqueLogoCollapse({
  children,
}: {
  children: React.ReactNode;
}) {
  const expanded = useAppStore((s) => s.searchExpanded);
  if (expanded) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Use both in `FiltersPageContent`**

In `components/Listing/FiltersPageContent.tsx`, import the two new components (with the other imports):
```tsx
import ListingBarOptions from "components/Listing/ListingBarOptions";
import BoutiqueLogoCollapse from "components/Listing/BoutiqueLogoCollapse";
```
Wrap the boutique mini-logo `<Suspense>` (left group) with `BoutiqueLogoCollapse`:
```tsx
                <FilterListingBackButton lang={Params.lang} isRtl={isRtl} />
                <BoutiqueLogoCollapse>
                  <Suspense fallback={<></>}>
                    <BoutiqueMiniLogo boutiquePromise={boutiquePromise} />
                  </Suspense>
                </BoutiqueLogoCollapse>
```
Replace the right-hand `<div data-cy="filter_bar_options" ...>...</div>` block with the `ListingBarOptions` wrapper:
```tsx
              <ListingBarOptions serverSearch={effectiveSearch} isRtl={isRtl}>
                <Suspense fallback={<></>}>
                  <ListingSearchContainer
                    country={country}
                    language={language}
                    filtersPromise={filtersDataPromise}
                    parsedFilters={parsedFilters}
                    serverSearch={effectiveSearch}
                  />
                </Suspense>
                <ListingBarActions
                  filtersPromise={filtersDataPromise}
                  language={language}
                  isRtl={isRtl}
                />
              </ListingBarOptions>
```

- [ ] **Step 4: Use `ListingBarOptions` in `featured` + `flashDeals`**

In `app/(client)/[lang]/featured/[[...filters]]/page.tsx`, import `ListingBarOptions` and replace the inline `<div data-cy="filter_bar_options" ...>...</div>` with:
```tsx
          <ListingBarOptions serverSearch={effectiveSearch} isRtl={isRtl}>
            <Suspense fallback={<></>}>
              <ListingSearchContainer
                country={country}
                language={language}
                featured={true}
                filtersPromise={filtersData}
                parsedFilters={parsedFilters}
                serverSearch={effectiveSearch}
              />
            </Suspense>
            <ListingBarActions
              filtersPromise={filtersData}
              language={language}
              isRtl={isRtl}
            />
          </ListingBarOptions>
```
Apply the same replacement in `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx`. (No boutique logo on these routes, so no `BoutiqueLogoCollapse`.)

- [ ] **Step 5: Verify build (boundary)**

Run: `npx tsc --noEmit` → clean. Run: `pnpm build` → succeeds. Visually the bar is unchanged (search box still collapsed; no `?search=` emitted yet). On `/en-gb/filters?search=nike` the options bar is full-width and the boutique logo is hidden on first paint.

- [ ] **Step 6: Commit**

```bash
git add components app
git commit -m "feat(listing): store-driven bar expand + boutique-logo hide (drop querySelector hacks)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Rebuild the search input — the swap to `?search=`

Replace `SearchBoutiquePage` with a locally-controlled input that commits to `?search=` (debounced 1.5s + Enter), shows the in-input spinner, drives `searchExpanded`, and keeps the ghost-suggestion feature. **This activates search-via-query.**

**Files:**
- Rewrite: `components/filterPage/SearchBoutiquePage.tsx`

**Interfaces:**
- Consumes: `serverSearch` prop (Task 3); `store.setListingSearchLoading`, `store.searchLoading`, `store.setSearchExpanded` (Task 1); `GetSearchSuggestion` (existing).

- [ ] **Step 1: Rewrite the component**

Replace `components/filterPage/SearchBoutiquePage.tsx` entirely:
```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import { LogError } from "utils/functions";
import { GetSearchSuggestion } from "serverRequests/Search";
import Spinner from "components/global/Spinner";

const COMMIT_DEBOUNCE_MS = 1500;

/**
 * SearchBoutiquePage — the listing search box (listing search → ?search=
 * refactor). Locally controlled (keeps focus/caret across the URL change),
 * commits the query to ?search= via router.replace 1.5s after typing stops or
 * immediately on Enter, and shows an in-input spinner (never a skeleton) from
 * the first keystroke until results land. Collapses when empty & unfocused;
 * expands on focus or when it holds a value (drives store.searchExpanded, which
 * widens the options bar and hides the boutique logo). Keeps the inline
 * ghost-suggestion (Tab / ArrowRight-at-end to accept).
 */
export default function SearchBoutiquePage({
  serverSearch = "",
  parsedFilters,
  country,
  language,
  featured = false,
  flashdeal = false,
}: {
  serverSearch?: string;
  parsedFilters: any;
  country: string;
  language: string;
  featured?: boolean;
  flashdeal?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setListingSearchLoading = useAppStore((s) => s.setListingSearchLoading);
  const setSearchExpanded = useAppStore((s) => s.setSearchExpanded);
  const searchLoading = useAppStore((s) => s.searchLoading);

  const [value, setValue] = useState(serverSearch ?? "");
  const [focused, setFocused] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const inputElRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const commitTimerRef = useRef<any>(null);
  const latestSuggestionRef = useRef(0);
  const suggestionTimerRef = useRef<any>(null);

  const expanded = focused || value.length > 0;

  // Publish expand state (widens options bar + hides boutique logo).
  useEffect(() => {
    setSearchExpanded(expanded);
  }, [expanded, setSearchExpanded]);

  // Commit the query to ?search= (shareable). replace = no history spam.
  const commit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      const current = params.get("search") || "";
      if (trimmed.length > 0) params.set("search", trimmed);
      else params.delete("search");

      // No-op commit (value unchanged from the URL): nothing will refetch, so
      // stop the spinner here — SortableGrid won't fire to clear it.
      if (trimmed === current) {
        setListingSearchLoading(false);
        return;
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, setListingSearchLoading],
  );

  const scheduleCommit = useCallback(
    (next: string) => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = setTimeout(
        () => commit(next),
        COMMIT_DEBOUNCE_MS,
      );
    },
    [commit],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    setListingSearchLoading(true); // spinner from first keystroke until results land
    scheduleCommit(next);
  };

  const flushCommit = () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commit(value);
  };

  // --- Inline completion (ghost text), scoped to the applied filters ---------
  const fetchSuggestion = useCallback(async () => {
    const requestId = ++latestSuggestionRef.current;
    try {
      const res = await GetSearchSuggestion({
        language,
        country,
        search_text: value,
        filters: {
          categories: parsedFilters?.categories,
          related_categories: parsedFilters?.related_categories,
          brands: parsedFilters?.brands,
          boutiques: parsedFilters?.boutiques,
          colors: parsedFilters?.colors,
          sizes: parsedFilters?.sizes,
          tags_names: parsedFilters?.tags_names,
          priceRange: parsedFilters?.prices,
          featured: featured || undefined,
          flashdeal: flashdeal || undefined,
        },
      });
      if (requestId === latestSuggestionRef.current) {
        setSuggestion(res?.suggestion || "");
      }
    } catch (error) {
      if (requestId === latestSuggestionRef.current) {
        setSuggestion("");
        LogError({ error, scenario: "fetchSuggestion in SearchBoutiquePage" });
      }
    }
  }, [language, country, value, parsedFilters, featured, flashdeal]);

  useEffect(() => {
    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    if (!value) {
      setSuggestion("");
      return;
    }
    suggestionTimerRef.current = setTimeout(fetchSuggestion, 600);
    return () => clearTimeout(suggestionTimerRef.current);
  }, [value, fetchSuggestion]);

  const ghostSuffix =
    value.length > 0 &&
    suggestion.toLowerCase().startsWith(value.toLowerCase()) &&
    suggestion.length > value.length
      ? suggestion.slice(value.length)
      : "";

  // Glue the ghost overlay to the input box (position/size/font/dir) so the gray
  // remainder starts exactly where typing ends, in both LTR and RTL.
  useEffect(() => {
    const input = inputElRef.current;
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!input || !overlay || !container) return;
    const ir = input.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const cs = getComputedStyle(input);
    overlay.style.left = `${ir.left - cr.left}px`;
    overlay.style.top = `${ir.top - cr.top}px`;
    overlay.style.width = `${ir.width}px`;
    overlay.style.height = `${ir.height}px`;
    overlay.style.lineHeight = `${ir.height}px`;
    overlay.style.paddingLeft = cs.paddingLeft;
    overlay.style.paddingRight = cs.paddingRight;
    overlay.style.fontFamily = cs.fontFamily;
    overlay.style.fontSize = cs.fontSize;
    overlay.style.fontWeight = cs.fontWeight;
    overlay.style.fontStyle = cs.fontStyle;
    overlay.style.letterSpacing = cs.letterSpacing;
    overlay.style.direction = cs.direction;
    overlay.style.textAlign = cs.textAlign;
  });

  const acceptSuggestion = () => {
    if (!ghostSuffix) return;
    const full = value + ghostSuffix;
    setValue(full);
    setSuggestion("");
    setListingSearchLoading(true);
    scheduleCommit(full);
    requestAnimationFrame(() => {
      const input = inputElRef.current;
      if (input) {
        input.focus();
        try {
          input.setSelectionRange(full.length, full.length);
        } catch {}
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (ghostSuffix) {
      const el = e.target as HTMLInputElement;
      const atEnd =
        el.selectionStart === value.length && el.selectionEnd === value.length;
      if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      flushCommit();
      (e.target as HTMLInputElement).blur();
    }
  };

  const isOpen = focused || value.length > 0;

  return (
    <div
      ref={containerRef}
      data-cy="searchIcon_boutiquePage"
      id="searchIconBoutique"
      className={`filter-option transition-all filter-search-option relative ${
        isOpen
          ? "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
          : ""
      }`}
      onClick={() => inputElRef.current?.focus()}
    >
      {/* Inline completion (ghost text) overlay. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute z-[5] overflow-hidden whitespace-pre pointer-events-none"
        style={{ boxSizing: "border-box" }}
      >
        {focused && ghostSuffix ? (
          <>
            <span className="text-transparent">{value}</span>
            <span className="text-[#c4c2c2]">{ghostSuffix}</span>
          </>
        ) : null}
      </div>

      <input
        ref={inputElRef}
        data-cy="inputFiled"
        id="filter-search"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${
          isOpen ? "pl-[40px]" : ""
        } rounded-[15px] w-0 h-full border-0 outline-hidden text-[#5d5d5d]`}
      />

      {/* Search icon collapses to a spinner while a search is in flight. */}
      <span
        className={`absolute z-10 ${
          isOpen ? "top-[9px] left-[14px]" : "top-0 left-0"
        }`}
      >
        {searchLoading ? (
          <Spinner no className="" />
        ) : (
          <img src="/icons/searchIcon.svg" alt="" />
        )}
      </span>
    </div>
  );
}
```
> RTL note: the container's `left-[14px]` icon offset matches the pre-refactor code (icon stayed left in both directions there). Keep as-is for parity; the ghost overlay already copies the input's computed `direction`.

- [ ] **Step 2: Verify build (boundary)**

Run: `npx tsc --noEmit` → clean. Run: `pnpm build` → succeeds.

- [ ] **Step 3: Manual verification (the core behavior)**

`pnpm dev`, then on `/en-gb/filters`:
- Click the search icon → box expands, boutique logo hides, options bar goes full width.
- Type "red nike shoes" → a spinner shows in the box immediately; **no skeletons**; the page does **not** flip and the caret never jumps. ~1.5 s after you stop, the URL becomes `/en-gb/filters?search=red%20nike%20shoes`, the grid swaps to analyzed results, spinner stops.
- Scroll → pagination continues consistently (analyzed name reused).
- Press Enter mid-type → commits immediately.
- Clear the box → grid returns to base results; empty box + blur collapses the bar and restores the logo.
- Type a gibberish query with no matches → "No products found" shows and the sort/filter/share trio disappears; clear it → they return.
- Repeat the first bullet on `/en-gb/featured` and `/en-gb/flashDeals`, and once with `ar` (RTL): `/sy-ar/filters`.

- [ ] **Step 4: Commit**

```bash
git add components/filterPage/SearchBoutiquePage.tsx
git commit -m "feat(listing): rebuild search input to commit ?search= (debounced, spinner, no skeleton, focus-safe)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Legacy `/filters/search/<value>` → `?search=` 308 redirect

Keep old shared links, sitemap-crawled URLs, and any missed path emitters working by permanently redirecting the path form to the query form.

**Files:**
- Create: `utils/listing/searchPathRedirect.ts`
- Modify: `app/(client)/[lang]/filters/[[...filters]]/page.tsx`
- Modify: `app/(client)/[lang]/featured/[[...filters]]/page.tsx`
- Modify: `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx`

**Interfaces:**
- Produces: `buildSearchRedirectTarget(lang, routeBase, filterParams, existingSearchParams): string | null` — returns the `?search=` URL to redirect to when the path contains a `search/<value>` pair, else `null`.

- [ ] **Step 1: Create the redirect helper**

Create `utils/listing/searchPathRedirect.ts`:
```ts
/**
 * If a legacy listing URL carries search as a path pair (`.../search/<value>`),
 * return the equivalent URL with search moved to `?search=<value>` and the pair
 * stripped from the path (all other path filters + existing query params kept).
 * Returns null when there is no path search pair to migrate.
 *
 * Part of the listing search → ?search= refactor: `?search=` is the single
 * source of truth; page components 308-redirect the legacy form to it.
 */
export function buildSearchRedirectTarget(
  lang: string,
  routeBase: "filters" | "featured" | "flashDeals",
  filterParams: string[] | undefined,
  existingSearch: Record<string, string | string[] | undefined>,
): string | null {
  const segs = filterParams ?? [];
  const i = segs.indexOf("search");
  if (i === -1 || i + 1 >= segs.length) return null;

  const rawValue = segs[i + 1];
  let value = rawValue;
  try {
    value = decodeURIComponent(rawValue);
  } catch {
    /* keep raw */
  }

  const remaining = [...segs.slice(0, i), ...segs.slice(i + 2)];
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(existingSearch)) {
    if (k === "search") continue;
    if (typeof v === "string") params.set(k, v);
    else if (Array.isArray(v) && v.length) params.set(k, v[0]);
  }
  if (value && value.length > 0) params.set("search", value);

  const path = `/${lang}/${routeBase}${
    remaining.length ? `/${remaining.join("/")}` : ""
  }`;
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
```

- [ ] **Step 2: Redirect in the `filters` page**

In `app/(client)/[lang]/filters/[[...filters]]/page.tsx`, add imports:
```tsx
import { redirect, permanentRedirect } from "next/navigation";
import { buildSearchRedirectTarget } from "utils/listing/searchPathRedirect";
```
In `Page`, before returning `<FiltersPageContent .../>`:
```tsx
export default async function Page({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};

  const legacy = buildSearchRedirectTarget(
    Params.lang,
    "filters",
    Params.filters,
    sp,
  );
  if (legacy) permanentRedirect(legacy); // 308, method-preserving

  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // @ts-ignore
  return <FiltersPageContent params={Params} sort={sort} search={search} />;
}
```
> `permanentRedirect` issues a 308. It throws (like `redirect`), so it must run before any output. Remove the unused `redirect` import if lint flags it — only `permanentRedirect` is used here.

- [ ] **Step 3: Redirect in `featured` + `flashDeals` pages**

In `app/(client)/[lang]/featured/[[...filters]]/page.tsx`, import `permanentRedirect` from `next/navigation` (it already imports nothing from there — add it) and `buildSearchRedirectTarget`. At the top of the `try` in `Page`, after `const sp = (await searchParams) ?? {};` and BEFORE the ES call:
```tsx
    const legacy = buildSearchRedirectTarget(
      Params.lang,
      "featured",
      Params.filters,
      sp,
    );
    if (legacy) permanentRedirect(legacy);
```
> Place the `permanentRedirect` OUTSIDE any `try/catch` that swallows errors, or re-throw: Next implements redirects by throwing a special error, and a bare `catch` would swallow it. In these pages the `catch` calls `LogServerError` then `throw` — the redirect error would be logged then re-thrown, which still redirects but logs noise. To avoid noise, compute `legacy` and call `permanentRedirect` **before** the `try` block (move the `sp`/`Params` reads above the `try`). Adjust accordingly.

Apply the same to `flashDeals` with `routeBase: "flashDeals"`.

- [ ] **Step 4: Verify build + manual**

Run: `pnpm build` → succeeds. `pnpm dev`, then open `/en-gb/filters/search/nike` → browser lands on `/en-gb/filters?search=nike` with the box pre-filled and analyzed results shown. Open `/en-gb/filters/categories/shoes/search/nike` → `/en-gb/filters/categories/shoes?search=nike`.

- [ ] **Step 5: Commit**

```bash
git add utils/listing/searchPathRedirect.ts app
git commit -m "feat(listing): 308-redirect legacy /search/<value> paths to ?search=

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Homepage global search emits `?search=`

The homepage search overlay is the primary way users reach the listing with a query; point it at `?search=`.

**Files:**
- Modify: `components/Home/Search/SearchIcon.tsx` (`handleKeyDown` ~371-383, `pageUrl` ~614-622)

**Interfaces:**
- Consumes: `buildParamsFromFilters` (existing, for the category/brand/boutique path portion).

- [ ] **Step 1: Build `?search=` URLs (Enter handler)**

In `components/Home/Search/SearchIcon.tsx`, replace the body of `handleKeyDown`'s `if (e.key === "Enter")` branch:
```tsx
    if (e.key === "Enter") {
      const pathParams = buildParamsFromFilters({
        categories: appliedFilters?.categories?.map((s) => s.slug),
        brands: appliedFilters?.brands?.map((s) => s.slug),
        boutiques: appliedFilters?.boutiques?.map((s) => s.slug),
        // search is a query param now — not a path segment
      });
      const base = `/${lang}/filters${
        pathParams.length ? `/${pathParams.join("/")}` : ""
      }`;
      const url = value?.trim()
        ? `${base}?search=${encodeURIComponent(value.trim())}`
        : base;
      setIsNavigating({ is_boutique: true });
      router.push(url);
    }
```

- [ ] **Step 2: Build `?search=` URL (Search button `pageUrl`)**

Replace the `pageUrl` helper in the `SearchContainer` sub-component:
```tsx
  const pageUrl = () => {
    const pathParams = buildParamsFromFilters({
      categories: applied_filter?.categories?.map((s) => s.slug),
      brands: applied_filter?.brands?.map((s) => s.slug),
      boutiques: applied_filter?.boutiques?.map((s) => s.slug),
    });
    const base = `/${lang}/filters${
      pathParams.length ? `/${pathParams.join("/")}` : ""
    }`;
    return value?.trim()
      ? `${base}?search=${encodeURIComponent(value.trim())}`
      : base;
  };
```

- [ ] **Step 3: Verify build + manual**

Run: `pnpm build` → succeeds. `pnpm dev`: open the homepage search, type "nike", press Enter (and separately click the "Search" button) → lands on `/en-gb/filters?search=nike` with analyzed results; add a category filter chip then search → `/en-gb/filters/categories/<slug>?search=nike`.

- [ ] **Step 4: Commit**

```bash
git add components/Home/Search/SearchIcon.tsx
git commit -m "feat(search): homepage search navigates to ?search= (compose with path filters)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: SEO — sitemap emits `?search=`, meta title keeps the term, stop emitting `search` into paths

Finish the migration so no code emits search into a path and SEO surfaces agree on `?search=`.

**Files:**
- Modify: `services/elastic/sitemap.service.ts:614-615`
- Modify: `utils/tinyUtils.tsx:329-369` (`buildParamsFromFilters`)
- Modify: `utils/server/index.tsx:493+` (`buildParamsFromFilters`)
- Modify: `serverRequests/meta/StructuredData/utils.ts:97-137` (`buildParamsFromFilters`)
- Modify: `app/(client)/[lang]/filters/[[...filters]]/page.tsx` + `featured` + `flashDeals` (`generateMetadata` reads `searchParams` for the title)

**Interfaces:**
- Consumes: `parseFiltersFromParams` stays tolerant of a legacy `search` path pair (do NOT remove its parsing) so the Task 8 redirect can read it.

- [ ] **Step 1: Sitemap → `?search=`**

In `services/elastic/sitemap.service.ts`, change the URL built at ~line 614-615:
```ts
    // Create URL: {baseUrl}/{country}-{language}/filters?search={encodedTerm}
    const url = `${baseUrl}/${countryIso}-${languageCode}/filters?search=${encodedTerm}`;
```

- [ ] **Step 2: Stop emitting `search` into paths (three `buildParamsFromFilters`)**

In `utils/tinyUtils.tsx`, remove `"search"` from the `filterOrder` array and delete the `if (filterType === "search")` branch so the function no longer emits a search pair:
```ts
  const filterOrder = [
    "boutiques",
    "tags_names",
    "categories",
    "brands",
    "colors",
    "sizes",
    "prices",
  ];
```
and change the value push to drop the search special-case:
```ts
      if (filterType === "colors") {
        const colorValues = values.map((color) =>
          color.startsWith("#") ? color.substring(1) : color,
        );
        params.push(colorValues.join(","));
      } else {
        params.push(values.join(","));
      }
```
Apply the identical removal to `utils/server/index.tsx › buildParamsFromFilters` and `serverRequests/meta/StructuredData/utils.ts › buildParamsFromFilters`.
> Leave `parseFiltersFromParams` (in `utils/server/index.tsx`) untouched — it must keep parsing a legacy `search` pair so the Task 8 redirect works.

- [ ] **Step 3: Meta title keeps the search term (via `searchParams`)**

In `app/(client)/[lang]/filters/[[...filters]]/page.tsx`, change `generateMetadata` to accept and forward `searchParams`:
```tsx
export async function generateMetadata({ params, searchParams }) {
  let Params = await params;
  const sp = (await searchParams) ?? {};
  const search = typeof sp.search === "string" ? sp.search : undefined;
  try {
    const metadata = await generateMetadataForListing({
      params,
      searchText: search,
    });
    return metadata;
  } catch (error) {
    // ...unchanged...
  }
}
```
In `serverRequests/meta/listing.tsx`, change the signature and title assembly:
```tsx
export async function generateMetadataForListing({
  params,
  routeBase = "filters",
  searchText,
}) {
```
Include `searchText` in the cache key so a searched title isn't served from the unsearched cache:
```tsx
  const cacheKey = `meta-listing-${routeBase}-${lang}-${
    filterParams?.join("-") || "none"
  }-${searchText || "nosearch"}`;
```
And prefer `searchText` over the (now absent) path search in `titleParts`:
```tsx
  const titleParts = [
    searchText
      ? `"${searchText}"`
      : parsedFilters.search_text?.[0]
        ? `"${parsedFilters.search_text[0]}"`
        : null,
    labels.boutique,
    // ...rest unchanged...
```
Apply the same `generateMetadata({ params, searchParams })` → `searchText` forwarding in the `featured` and `flashDeals` pages (their `generateMetadata` calls `generateMetadataForListing({ params, routeBase })`; add `searchText: search`).

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit` → clean. Run: `pnpm build` → succeeds. Run: `pnpm knip` → no NEW orphaned exports beyond the pre-existing baseline (the removed search branch shouldn't orphan anything; if `pollinateInput` is now unused because the old input was its only consumer, that's expected — leave it unless knip flags it as an error you introduced).

- [ ] **Step 5: Commit**

```bash
git add services utils serverRequests app
git commit -m "feat(seo): sitemap + meta emit ?search=; stop building search into listing paths

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Build + lint + knip**

Run: `pnpm build` → succeeds. Run: `pnpm lint` → clean. Run: `pnpm knip` → review output; remove any export this refactor orphaned (e.g. confirm `pollinateInput` / the old `search_text`/`isAnalyzed` input props aren't dangling). Do not delete anything still referenced elsewhere.

- [ ] **Step 2: Manual acceptance matrix**

For each of `/en-gb/filters`, `/en-gb/featured`, `/en-gb/flashDeals`, and once in RTL (`/sy-ar/filters`):
1. **AC-1/AC-2/AC-3:** type a multi-word query → spinner in the box, no skeleton, no page flip, focus retained; ~1.5 s later `?search=` updates and analyzed results render; Enter commits immediately.
2. **AC-4:** empty+blur collapses the box; focus/value expands it; boutique logo hides while expanded (filters route only).
3. **AC-5:** scroll the searched grid → consistent pagination, no dup/skip.
4. **AC-6:** search a no-match query → "No products found" + trio hidden; clear → trio + grid return.
5. **AC-7:** reload the `?search=` URL → identical state via SSR.
6. **AC-8:** open `/en-gb/filters/search/<term>` → 308 to `?search=`; homepage search → `?search=`.
7. **AC-9:** apply a category path filter + a sort + a search together → all three in the URL, grid correct.

- [ ] **Step 3: Confirm the working tree is clean and pushed intent**

Run: `git status` → only the intended files changed across the task commits; the user's pre-existing unrelated working-tree edits (in `services/wallet/index.ts`, etc.) are untouched. Leave `develop` as-is (no push unless the user asks).

---

## Self-Review

**Spec coverage** (spec §2 goals → task):
- Search in `?search=` → Tasks 3, 7. Flip-free/focus → Task 7 (local state + `router.replace`) validated in 7/11. No skeleton + spinner → Tasks 4, 7. Debounce 1.5s + Enter → Task 7. Collapse/expand → Tasks 1, 6, 7. Analyze-search → Tasks 2, 4 (raw query → `isAnalyzed.name` paging). Reactive empty-gate → Tasks 4, 5. Correct grid + empty-state → Task 4. Single source of truth (homepage/meta/sitemap + 308) → Tasks 8, 9, 10. Uniform ×3 routes → every server/page task touches all three. All 10 ACs mapped in Task 11's matrix.

**Placeholder scan:** No TBD/TODO; every code step shows full code. Verify steps use concrete commands (`npx tsc --noEmit`, `pnpm build/lint/knip`) and expected outcomes.

**Type consistency:** `serverSearch` (string) threaded page → `FiltersPageContent`/`ListingSearchContainer`/`ProductListConainer`/`ProductListServer`/`SortableGrid`. `serverHasResults` (boolean) ProductListServer → SortableGrid; `ListingBarActionsClient` prop is also `serverHasResults`. Store setters `setListingSearchLoading/setSearchHasResults/setSearchExpanded` defined in Task 1, used in Tasks 4/5/7. `GetProductsResult.isAnalyzed` defined in Task 2, read in Task 4. `ProductsInfiniteScroll` new props `searchMode`/`searchQuery` defined in Task 4, passed by `SortableGrid` in Task 4. `buildSearchRedirectTarget` signature consistent between Task 8 steps 1 and 2–3.

**Known deliberate call-outs:** `firstPageSkeleton` remains on for pure-sort (unchanged sort UX) and off for search. The empty-gate seed relies on `ListingBarActionsClient` re-seeding on server re-render + `SortableGrid` restoring on the server-grid branch — both covered. Old input's `isAnalyzed` color/size path-stripping is intentionally not reimplemented (search no longer rewrites filter paths; spec §8.6).
