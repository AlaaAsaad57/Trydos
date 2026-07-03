"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";

/**
 * SortableGrid — makes the listing sort (`?sort=`) actually re-order the grid
 * without a full reload.
 *
 * Why this exists instead of `router.refresh()`:
 *   next.config `staleTimes.dynamic: 30` caches the dynamic page RSC and does
 *   NOT vary it by search params, so a query-only navigation reuses the stale,
 *   already-rendered product grid. `router.refresh()` proved unreliable here
 *   (it cancels the sort `router.push`, or does not re-render). The one thing
 *   that is always fresh is a Server Action (`GetProducts`) — a POST that runs
 *   on every call and bypasses the Router Cache entirely.
 *
 * How it works:
 *   The server has already rendered `children` for `serverSort` (the sort in the
 *   URL at request time). While the live `?sort=` matches `serverSort` we render
 *   that untouched — the default path, SSR, and normal page-1 + infinite-scroll
 *   pagination are completely unchanged. The moment the user picks a DIFFERENT
 *   sort, we swap to a fresh `ProductsInfiniteScroll` paged from page 1 with the
 *   new sort (client-fetched, always fresh), which shows a skeleton while the
 *   first page loads. Selecting the server's sort again returns the server grid.
 *
 * Uniform across filters / featured / flashDeals (all render ProductList).
 */
export default function SortableGrid({
  children,
  serverSort = "",
  currency,
  boutiqueName,
  parsedFilters,
  isFeatured = false,
  isFlashDeals = false,
  sizesFilters = null,
}: {
  children: React.ReactNode;
  serverSort?: string;
  currency: any;
  boutiqueName?: string;
  parsedFilters: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  sizesFilters?: string[] | null;
}) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "";
  const showingServerGrid = sortParam === serverSort;

  // When the sort returns to the server-rendered order we simply re-show the
  // already-mounted server grid — no ProductsInfiniteScroll remounts to clear the
  // page loader that Confirm set. Clear it here so the loader never hangs.
  useEffect(() => {
    if (showingServerGrid) useAppStore.getState().setIsNavigating(null);
  }, [showingServerGrid]);

  if (showingServerGrid) return <>{children}</>;

  return (
    <ProductsInfiniteScroll
      key={`sorted-${sortParam}`}
      offset={[]}
      pit_id={null}
      recomended_offset={null}
      boutiqueName={boutiqueName}
      analyticsData={[]}
      parsedFilters={parsedFilters}
      currency={currency}
      isFeatured={isFeatured}
      isFlashDeals={isFlashDeals}
      sizes_filters={sizesFilters}
      sort={sortParam}
      firstPageSkeleton
    />
  );
}
