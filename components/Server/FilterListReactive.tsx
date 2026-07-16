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
