"use client";
import { useEffect, useState } from "react";
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
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";

function ProductsInfiniteScroll({
  offset,
  currency,
  boutiqueName,
  analyticsData,
  parsedFilters,
  isFeatured,
  isFlashDeals,
  recomended_offset = null,
}: {
  offset: any;
  currency: any;
  analyticsData: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  parsedFilters: any;
  boutiqueName;
  recomended_offset?: any;
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
    setTimeout(() => {
      getProductsReq();
    }, 1000);
  }, []);

  const [products, setProducts] = useState<any[]>([]);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [recommendedOffset, setRecommendedOffset] = useState(recomended_offset);
  const [loading, setLoading] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);
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
    if (loading || isReachEnd) return;
    setLoading(true);
    let user = getCookie<any>(COOKIE_NAMES.USER_DATA);
    let userId = user?.id;
    const response = await GetProducts({
      country,
      language: languageVariable,
      currency,
      offset: offsetValue,
      parsedFilters: parsedFilters,
      userId: userId,
      recomended_offset: recommendedOffset,
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
    if (!areArraysEqual(offsetValue, response.offset)) {
      setProducts([...(products ?? []), ...response.items]);
      if (response.GA_PRODUCTS_LIST?.length > 0) {
        GAevent({
          action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
          params: {
            items: response.GA_PRODUCTS_LIST,
            item_list_name: getItemsListName(),
            user_id_custom: auth.UserID(),
            screen_name: getScreen(),
            screen_path: window.location.pathname,
          },
        });
      }
    }
    setOffsetValue(response.offset);
    setLoading(false);

    if (
      response.items.length === 0 ||
      areArraysEqual(offsetValue, response.offset)
    ) {
      setLoading(false);
      setIsReachEnd(true);
    }
  };
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
