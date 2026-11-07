"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogError, translateFunction } from "utils/functions";
import search from "services/search";
import { showErrorNotification } from "store/notifications/reducer";
import { buildParamsFromFilters } from "utils/tinyUtils";
import { GetSearchData, GetSearchSuggestion } from "serverRequests/Search";
import { useAppStore } from "store";
import { useSearchHistory } from "./useSearchHistory";
import { useSearchLog } from "./useSearchLog";

/**
 * The search's state and logic, moved out of the old search box
 * (`SearchIcon`) unchanged, so the new search page (`/[lang]/search`, Stage 7,
 * D-44) and the old box share one copy:
 *
 *  - history (`useSearchHistory`, from the server) and trending
 *    (`search.getTrendingSearch`), read when the search opens;
 *  - results (products, brands, categories, boutiques, related categories)
 *    from `GetSearchData`, 400 ms after the last key or filter change, with a
 *    guard so an older answer never replaces a newer one;
 *  - the inline completion (`GetSearchSuggestion`), with the same wait and
 *    guard;
 *  - "load more" of brands, categories and boutiques;
 *  - Enter opens the result listing (`/[lang]/filters/...?search=`).
 *
 * `enabled` is the old box's "search is open". The page passes true.
 */

export type SearchResultsState = {
  categories: any[];
  brands: any[];
  boutiques: any[];
  products: any[];
  total_size: number;
  related_categories: any[];
};

export type AppliedSearchFilters = {
  categories: any[];
  brands: any[];
  boutiques: any[];
};

export type SearchOffsets = { brands: number; categories: number; boutiques: number };

const EMPTY_RESULTS: SearchResultsState = {
  categories: [],
  brands: [],
  boutiques: [],
  products: [],
  total_size: 0,
  related_categories: [],
};

/** The wait after the last key before a search or a completion is asked for. */
export const SEARCH_WAIT_MS = 400;

export function useSearch({
  language,
  country,
  enabled,
}: {
  language: string;
  country: string;
  enabled: boolean;
}) {
  const setIsNavigating = useAppStore((s) => s.setIsNavigating);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");

  // Inline completion (ghost text) suggestion — full suggested product name
  const [suggestion, setSuggestion] = useState("");

  const [trending, setTrending] = useState<any[]>([]);
  const { searchHistory, removeHistoryWord, clearHistory } = useSearchHistory(enabled);
  const { scheduleLog, cancelLog } = useSearchLog(value, enabled);
  const [results, setResults] = useState<SearchResultsState>(EMPTY_RESULTS);
  const [appliedFilters, setAppliedFilters] = useState<AppliedSearchFilters>({
    categories: [],
    brands: [],
    boutiques: [],
  });
  const [offsets, setOffsets] = useState<SearchOffsets>({
    brands: 1,
    categories: 1,
    boutiques: 1,
  });
  // Visibility of Load More buttons (if < 10 items, set to false)
  const [hasMore, setHasMore] = useState({
    brands: true,
    categories: true,
    boutiques: true,
  });

  // Refs for handling race conditions and debouncing
  const latestRequestRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Separate race-condition + debounce refs for the suggestion query so it
  // can't clobber a stale ghost over newer input.
  const latestSuggestionRef = useRef(0);
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeFilters = (applied_filters: AppliedSearchFilters) => {
    let obj = {};
    if (applied_filters?.categories) {
      obj = { ...obj, categories: applied_filters.categories.map((s) => s.slug) };
    }
    if (applied_filters?.brands) {
      obj = { ...obj, brands: applied_filters.brands.map((s) => s.slug) };
    }
    if (applied_filters?.boutiques) {
      obj = { ...obj, boutiques: applied_filters.boutiques.map((s) => s.slug) };
    }
    return obj;
  };

  // --- Main search (debounced, race condition handled) ---
  const performSearch = useCallback(
    async ({ isInitial = false }: { searchTerm?: string; isInitial?: boolean }) => {
      const requestId = ++latestRequestRef.current;
      setLoading(true);
      try {
        // Reset offsets and hasMore on a new search
        setOffsets({ brands: 1, categories: 1, boutiques: 1 });
        setHasMore({ brands: true, categories: true, boutiques: true });

        const res: any = await GetSearchData({
          language,
          country,
          filters: { ...normalizeFilters(appliedFilters), search_text: value },
          noProducts: isInitial,
          filters_offset: 1,
        });
        // Only the latest request may update the results.
        if (requestId === latestRequestRef.current) {
          // The color/size analysis runs only on a search with 2+ words. When it
          // fails, GetSearchData sends its error back as a string and searches
          // the raw words. Tell the shopper, but never show the raw error text.
          if (typeof res?.isAnalyzed === "string") {
            showErrorNotification(
              translateFunction(
                "We could not read the color and size from your search. Showing results for your words.",
              ),
            );
          }
          setResults({
            boutiques: res.boutiques || [],
            brands: res.brands || [],
            categories: res.categories || [],
            products: isInitial ? [] : res.products || [],
            total_size: res.total_size,
            related_categories: res.related_categories || [],
          });
          setHasMore({
            brands: (res.brands?.length || 0) >= 10,
            categories: (res.categories?.length || 0) >= 10,
            boutiques: (res.boutiques?.length || 0) >= 10,
          });
          setLoading(false);
          if (!isInitial) scheduleLog(value, res.total_size ?? 0);
        }
      } catch (error) {
        if (requestId === latestRequestRef.current) {
          LogError({ error, scenario: "performSearch in SearchIcon" });
          setLoading(false);
        }
      }
    },
    [language, country, appliedFilters, value],
  );

  // --- Trending, when the search opens ---
  useEffect(() => {
    if (enabled) getInitialStaticData();
  }, [enabled]);

  const getInitialStaticData = async () => {
    try {
      const [trendingRes] = await Promise.all([
        search.getTrendingSearch(),
        performSearch({ isInitial: true }),
      ]);
      setTrending(trendingRes.popular_search_terms);
    } catch (error) {
      LogError({ error, scenario: "getInitialStaticData in SearchIcon" });
    }
  };

  // --- Search on a text or filter change ---
  useEffect(() => {
    if (!enabled) return;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      const hasFilters = Object.values(appliedFilters).some((arr) => arr.length > 0);
      if (value.length > 0 || hasFilters) {
        performSearch({ searchTerm: value });
      } else {
        // Both empty: the first state (history and trending).
        setResults(EMPTY_RESULTS);
        performSearch({ isInitial: true });
      }
    }, SEARCH_WAIT_MS);
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [value, appliedFilters, enabled, performSearch]);

  // --- Inline completion (ghost text), same conditions as the main search ---
  const fetchSuggestion = useCallback(async () => {
    const requestId = ++latestSuggestionRef.current;
    try {
      const res: any = await GetSearchSuggestion({
        language,
        country,
        search_text: value,
        // Scope the completion to the active filters, same as the main search.
        filters: normalizeFilters(appliedFilters),
      });
      if (requestId === latestSuggestionRef.current) {
        setSuggestion(res?.suggestion || "");
      }
    } catch (error) {
      if (requestId === latestSuggestionRef.current) {
        setSuggestion("");
        LogError({ error, scenario: "fetchSuggestion in SearchIcon" });
      }
    }
  }, [language, country, value, appliedFilters]);

  useEffect(() => {
    if (!enabled) return;
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    // Only when the shopper has typed text.
    if (value.length === 0) {
      setSuggestion("");
      return;
    }
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestion();
    }, SEARCH_WAIT_MS);
    return () => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    };
  }, [value, enabled, fetchSuggestion]);

  // The visible ghost remainder: only when the suggestion really extends the
  // typed text (case-insensitive starts-with).
  const ghostSuffix =
    value.length > 0 &&
    suggestion.toLowerCase().startsWith(value.toLowerCase()) &&
    suggestion.length > value.length
      ? suggestion.slice(value.length)
      : "";

  const acceptSuggestion = () => {
    if (!ghostSuffix) return false;
    setValue(value + ghostSuffix);
    setSuggestion("");
    return true;
  };

  // --- Load more of one result row ---
  const handleLoadMore = async (type: keyof SearchOffsets) => {
    if (loading) return;
    const nextOffset = offsets[type] + 1;
    setLoading(true);
    try {
      const res: any = await GetSearchData({
        language,
        country,
        filters: { ...normalizeFilters(appliedFilters), search_text: value },
        noProducts: true,
        filters_offset: nextOffset,
      });
      const newItems = res[type] || [];
      setResults((prev) => ({ ...prev, [type]: [...prev[type], ...newItems] }));
      setOffsets((prev) => ({ ...prev, [type]: nextOffset }));
      // Fewer than 10 items: no more pages.
      if (newItems.length < 10) setHasMore((prev) => ({ ...prev, [type]: false }));
      setLoading(false);
    } catch (error) {
      LogError({ error, scenario: "handleLoadMore in SearchIcon" });
      setLoading(false);
    }
  };

  // --- Keys in the search field ---
  const { lang } = useParams();
  const router = useRouter();
  const handleKeyDown = (e: any) => {
    // Accept the inline completion with Tab, or ArrowRight at the end.
    if (ghostSuffix) {
      const atEnd =
        e.target.selectionStart === value.length && e.target.selectionEnd === value.length;
      if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
    }
    if (e.key === "Enter") {
      cancelLog();
      const pathParams = buildParamsFromFilters({
        categories: appliedFilters?.categories?.map((s) => s.slug),
        brands: appliedFilters?.brands?.map((s) => s.slug),
        boutiques: appliedFilters?.boutiques?.map((s) => s.slug),
        // search is a query param now — not a path segment
      });
      const base = `/${lang}/filters${pathParams.length ? `/${pathParams.join("/")}` : ""}`;
      const url = value?.trim() ? `${base}?search=${encodeURIComponent(value.trim())}` : base;
      setIsNavigating({ is_boutique: true });
      router.push(url);
    }
  };

  /** Back to the first state: no text, no results. */
  const clear = () => {
    setValue("");
    setSuggestion("");
    setResults(EMPTY_RESULTS);
  };

  return {
    value,
    setValue,
    loading,
    results,
    trending,
    searchHistory,
    removeHistoryWord,
    clearHistory,
    appliedFilters,
    setAppliedFilters,
    setOffsets,
    hasMore,
    loadMore: handleLoadMore,
    ghostSuffix,
    acceptSuggestion,
    handleKeyDown,
    clear,
  };
}
