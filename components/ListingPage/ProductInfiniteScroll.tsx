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
  const seenIdsRef = useRef<Set<string>>(
    new Set((analyticsData || []).map((product) => String(product?.item_id))),
  );

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
      if (response.items.length === 0 || sameOffset) {
        isReachEndRef.current = true;
        setIsReachEnd(true);
        return;
      }

      const incomingIds = (response.GA_PRODUCTS_LIST || []).map((product) =>
        String(product?.item_id),
      );

      const uniqueIndexes = incomingIds
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => {
          if (!id) return false;
          if (seenIdsRef.current.has(id)) return false;
          seenIdsRef.current.add(id);
          return true;
        })
        .map(({ index }) => index);

      const temp_products =
        uniqueIndexes.length > 0
          ? uniqueIndexes.map((index) => response.items[index]).filter(Boolean)
          : response.items;

      if (temp_products.length > 0) {
        setProducts((prev) => [...prev, ...temp_products]);
      }

      if (response.GA_PRODUCTS_LIST?.length > 0) {
        const uniqueAnalytics =
          uniqueIndexes.length > 0
            ? uniqueIndexes
                .map((index) => response.GA_PRODUCTS_LIST[index])
                .filter(Boolean)
            : response.GA_PRODUCTS_LIST;

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

      offsetRef.current = response.offset;
      recommendedOffsetRef.current = response.recomended_offset;
      setOffsetValue(response.offset);
      setRecommendedOffset(response.recomended_offset);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
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
