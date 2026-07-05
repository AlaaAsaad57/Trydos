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
