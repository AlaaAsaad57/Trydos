"use client";
import { useEffect, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { EnableScroll } from "utils/tinyUtils";
import auth from "services/auth";
import { GetProducts } from "serverRequests/listing";
import ProductCard from "components/products/ProductCard";
import { ProductCardSkeleton } from "components/skeleton/listing";
import {
  BagReachedEnd,
  BagNoResults,
} from "components/Listing/illustrations/ListingBagIllustration";

function ProductsInfiniteScroll({
  offset,
  currency,
  boutiqueName,
  analyticsData,
  parsedFilters,
  isFeatured,
  isFlashDeals,
  recomended_offset = null,
  sizes_filters = null,
  pit_id = null,
  sort = undefined,
  firstPageSkeleton = false,
  searchMode = false,
  searchQuery = "",
}: {
  offset: any;
  currency: any;
  analyticsData: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  parsedFilters: any;
  boutiqueName;
  recomended_offset?: any;
  sizes_filters?: string[] | null;
  pit_id?: string | null;
  sort?: string;
  // When this component owns the WHOLE grid (client sort refetch from page 1),
  // show product-card skeletons while the first page is loading, instead of the
  // small bottom spinner used for load-more.
  firstPageSkeleton?: boolean;
  // Search-driven client refetch (?search=): no skeleton (in-input spinner
  // instead), forward the analyzed name to later pages, and write result state
  // to the store for the reactive empty-gate.
  searchMode?: boolean;
  searchQuery?: string;
}) {
  const resetBoutique = useAppStore((s) => s.resetBoutique);
  const { lang }: { lang: string } = useParams();
  // @ts-ignore
  let [country, languageVariable] = lang.split("-");
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const getScreen = () => {
    let screen_name = "";
    let url = window.location.pathname;
    if (url.includes("filters/boutique")) {
      screen_name = GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
    } else if (url.includes("tags_names")) {
      screen_name = GA_GLOBAL_SCREEN.TAGS_SCREEN;
    } else if (url.includes("/filters")) {
      screen_name = GA_GLOBAL_SCREEN.FILTERS_SCREEN;
    } else {
      screen_name = GA_GLOBAL_SCREEN.HOME_SCREEN;
    }
    return screen_name;
  };
  const [products, setProducts] = useState<any[]>([]);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [recommendedOffset, setRecommendedOffset] = useState(recomended_offset);
  const [loading, setLoading] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);
  const isFetchingRef = useRef(false);
  const offsetRef = useRef(offset);
  const recommendedOffsetRef = useRef(recomended_offset);
  const isReachEndRef = useRef(false);
  // Whether the full-screen page loader (isNavigating) has been cleared for this
  // mount. A normal navigation arrival clears it on mount (the server grid is
  // already here); a client-owned first-page refetch (sort confirm / cleared
  // filters landing here) keeps it up until the first page's data actually lands.
  const pageLoaderClearedRef = useRef(false);
  // PIT snapshot id for this filter session (ADR-009). Rotated from each
  // response; reset to the new first-page snapshot on the keyed remount.
  const pitIdRef = useRef<string | null>(pit_id);
  // For a search session: page 1 sends the RAW query so ES analyzes it; from the
  // response we lock the analyzed name and page 2+ reuse it (parity with the
  // server's ProductListConainer), keeping the PIT snapshot consistent.
  const searchNameRef = useRef<string | null>(searchMode ? searchQuery : null);
  // Bounded auto-advance guard: how many consecutive all-already-seen pages
  // we've skipped. Caps the auto-advance loop so it can never spin (AC-9).
  const emptyPagesRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(
    new Set((analyticsData || []).map((product) => String(product?.item_id))),
  );
  const searchResultPublishedRef = useRef(false);
  // Page size requested from the server; a shorter page means the last page.
  const PAGE_LIMIT = 10;
  const MAX_CONSECUTIVE_EMPTY_PAGES = 5;

  useEffect(() => {
    offsetRef.current = offsetValue;
  }, [offsetValue]);

  useEffect(() => {
    recommendedOffsetRef.current = recommendedOffset;
  }, [recommendedOffset]);

  useEffect(() => {
    isReachEndRef.current = isReachEnd;
  }, [isReachEnd]);

  function areArraysEqual(oldArray: number[], newArray: number[]): boolean {
    if (oldArray.length !== newArray.length) return false;

    for (let i = 0; i < oldArray.length; i++) {
      if (oldArray[i] !== newArray[i]) {
        return false;
      }
    }

    return true;
  }

  const getProductsReq = async () => {
    if (isFetchingRef.current || isReachEndRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    // Set when an all-already-seen page advanced the cursor: we must fetch the
    // next page ourselves, otherwise the in-view sentinel stays put and stalls.
    let scheduleNext = false;
    try {
      let user = useAppStore.getState().userProfile;
      let userId = user?.id;
      const response = await GetProducts({
        country,
        language: languageVariable,
        currency,
        offset: offsetRef.current,
        parsedFilters: searchMode
          ? { ...parsedFilters, search_text: searchNameRef.current || undefined }
          : parsedFilters,
        userId: userId,
        recomended_offset: recommendedOffsetRef.current,
        sizes_filters: sizes_filters,
        // User-facing listing sort (`?sort=`); the remount key ensures a fresh
        // mount (offset/seenIds/pit reset) whenever sort changes, so every page
        // of this session pages the same sort order.
        sort: sort,
        // PIT snapshot pagination (ADR-009): carry the session snapshot id.
        pit_id: pitIdRef.current,
      });

      if (!response) {
        showErrorNotification(
          translateFunction("Failed To Load Products Retring in 3 seconds"),
        );
        setTimeout(() => {
          getProductsReq();
        }, 3000);
        return;
      }

      // Lock the analyzed name from page 1 so subsequent pages stay consistent.
      if (searchMode && searchNameRef.current === searchQuery) {
        const analyzedName = response?.isAnalyzed?.name;
        if (analyzedName && typeof analyzedName === "string") {
          searchNameRef.current = analyzedName;
        }
      }

      const sameOffset = areArraysEqual(offsetRef.current, response.offset);
      // End of results when: the page is empty, the cursor did not advance, or
      // it is a short (final) page. A short page can still carry new items, so
      // we append first and set reach-end afterwards.
      const reachedEnd =
        response.products.length === 0 ||
        sameOffset ||
        response.products.length < PAGE_LIMIT;

      // Dedupe by each item's OWN product id (parallel to items). Fall back to
      // the analytics array only if productIds is unavailable, so dedupe never
      // silently breaks if the analytics list is missing/misaligned.
      const incomingIds: string[] = (
        response.productIds && response.productIds.length > 0
          ? response.productIds
          : (response.GA_PRODUCTS_LIST || []).map((p) => p?.item_id)
      ).map((id) => String(id));

      const uniqueIndexes = incomingIds
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => {
          if (!id || id === "undefined") return false;
          if (seenIdsRef.current.has(id)) return false;
          seenIdsRef.current.add(id);
          return true;
        })
        .map(({ index }) => index);

      // Hard guarantee: only ever append never-seen items. No whole-page
      // fallback — an all-duplicate page appends nothing (Layer 1, ADR-009).
      const temp_products = uniqueIndexes
        .map((index) => response.products[index])
        .filter(Boolean);

      if (temp_products.length > 0) {
        setProducts((prev) => [...prev, ...temp_products]);
      }

      // Analytics only for the newly-shown items.
      if (uniqueIndexes.length > 0 && response.GA_PRODUCTS_LIST?.length > 0) {
        const uniqueAnalytics = uniqueIndexes
          .map((index) => response.GA_PRODUCTS_LIST[index])
          .filter(Boolean);

        if (uniqueAnalytics.length > 0) {
          GAevent({
            action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
            params: {
              items: uniqueAnalytics,
              item_list_name: getItemsListName(),
              user_id_custom: auth.UserID(),
              screen_name: getScreen(),
              screen_path: window.location.pathname,
            },
          });
        }
      }

      // Advance the cursor and rotate the PIT id for the next page.
      offsetRef.current = response.offset;
      recommendedOffsetRef.current = response.recomended_offset;
      pitIdRef.current = response.pit_id ?? pitIdRef.current;
      setOffsetValue(response.offset);
      setRecommendedOffset(response.recomended_offset);

      if (reachedEnd) {
        isReachEndRef.current = true;
        setIsReachEnd(true);
        return;
      }

      // A full-size page that added nothing new → auto-advance to the next page
      // (bounded), so duplicates never render and the scroll never stalls.
      if (temp_products.length === 0) {
        emptyPagesRef.current += 1;
        if (emptyPagesRef.current >= MAX_CONSECUTIVE_EMPTY_PAGES) {
          isReachEndRef.current = true;
          setIsReachEnd(true);
          return;
        }
        scheduleNext = true;
      } else {
        emptyPagesRef.current = 0;
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      // First page has resolved → the client-owned refetch's data has landed;
      // clear the page loader now (a no-op if a normal mount already cleared it).
      if (!pageLoaderClearedRef.current) {
        pageLoaderClearedRef.current = true;
        useAppStore.getState().setIsNavigating(null);
      }
      // Search session: page 1 has resolved → stop the in-input spinner and
      // publish the has-results verdict for the empty-gate + empty-state.
      if (searchMode && !searchResultPublishedRef.current) {
        searchResultPublishedRef.current = true;
        const store = useAppStore.getState();
        store.setListingSearchLoading(false);
        store.setSearchHasResults(seenIdsRef.current.size > 0);
        store.setSearchHasMultipleResults(seenIdsRef.current.size > 1);
      }
    }

    if (scheduleNext) {
      setTimeout(() => {
        getProductsReq();
      }, 0);
    }
  };

  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    // Normal navigation arrival: the server-rendered grid is already present, so
    // the destination has "arrived" — clear the page loader on mount. For a
    // client-owned first-page refetch (firstPageSkeleton), keep it up until the
    // first page's data lands (cleared in getProductsReq's finally).
    if (!firstPageSkeleton) {
      setIsNavigating(null);
      pageLoaderClearedRef.current = true;
    }

    GAevent({
      action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
      params: {
        items: analyticsData,
        item_list_name: getItemsListName(),
        screen_name: getScreen(),
        screen_path: window.location.pathname,
        user_id_custom: auth.UserID(),
      },
    });
    EnableScroll();
    resetBoutique();
    getProductsReq();
  }, []);
  const getItemsListName = () => {
    if (isFeatured) {
      return "Featured-Products";
    }
    if (isFlashDeals) {
      return "FlashDeals-Products";
    }
    if (parsedFilters?.boutiques?.length === 1 && boutiqueName) {
      return `${boutiqueName}-Boutique-Page`;
    } else return "Filters-Page";
  };
  // First-page product-card skeletons for a client-owned refetch: a sort
  // confirm/cleared-filters landing (firstPageSkeleton) OR a search refetch
  // (searchMode). Search previously showed only the centered bottom spinner;
  // it now shows skeletons like sort. While these are up we suppress that
  // bottom spinner so the grid never shows a spinner + skeletons at once.
  const showFirstPageSkeleton =
    (firstPageSkeleton || searchMode) && products.length === 0 && !isReachEnd;
  return (
    <>
      {products.map((product) => (
        <ProductCard
          key={product?.product_id ?? product?.slug}
          product={product}
          currency={currency}
          country={country}
          language={languageVariable}
          sliders={true}
          sizesFilters={sizes_filters}
        />
      ))}

      {showFirstPageSkeleton &&
        Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={`sort-skeleton-${i}`} />
        ))}

      <div
        className="get-next-product absolute left-0 right-0 bottom-[200px] flex flex-col items-center justify-center"
        data-pw="ReachEnd"
      >
        {!isReachEnd ? (
          !loading ? (
            <InView
              threshold={0.5}
              className="spinner-container"
              as="div"
              onChange={(inView) => {
                if (inView && !loading) {
                  getProductsReq();
                }
              }}
            ></InView>
          ) : showFirstPageSkeleton ? null : (
            <Spinner no={false} className="" />
          )
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
      </div>
    </>
  );
}

export default ProductsInfiniteScroll;
