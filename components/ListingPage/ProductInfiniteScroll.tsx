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
}) {
  const { resetBoutique } = useAppStore();
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
  // PIT snapshot id for this filter session (ADR-009). Rotated from each
  // response; reset to the new first-page snapshot on the keyed remount.
  const pitIdRef = useRef<string | null>(pit_id);
  // Bounded auto-advance guard: how many consecutive all-already-seen pages
  // we've skipped. Caps the auto-advance loop so it can never spin (AC-9).
  const emptyPagesRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(
    new Set((analyticsData || []).map((product) => String(product?.item_id))),
  );
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
        parsedFilters: parsedFilters,
        userId: userId,
        recomended_offset: recommendedOffsetRef.current,
        sizes_filters: sizes_filters,
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

      const sameOffset = areArraysEqual(offsetRef.current, response.offset);
      // End of results when: the page is empty, the cursor did not advance, or
      // it is a short (final) page. A short page can still carry new items, so
      // we append first and set reach-end afterwards.
      const reachedEnd =
        response.items.length === 0 ||
        sameOffset ||
        response.items.length < PAGE_LIMIT;

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
        .map((index) => response.items[index])
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
    }

    if (scheduleNext) {
      setTimeout(() => {
        getProductsReq();
      }, 0);
    }
  };

  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);

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
    const timer = setTimeout(() => {
      getProductsReq();
    }, 1000);

    return () => clearTimeout(timer);
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
  return (
    <>
      {products}

      <div
        className="get-next-product regular-text color-dark-gray absolute flex justify-center items-end bottom-[300px]"
        data-cy="ReachEnd"
      >
        {!isReachEnd ? (
          <>
            {!loading ? (
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
            ) : (
              <h2>{loading && <Spinner no={false} className="" />}</h2>
            )}
          </>
        ) : (
          <>{translate("Reach End")}</>
        )}
      </div>
    </>
  );
}

export default ProductsInfiniteScroll;
