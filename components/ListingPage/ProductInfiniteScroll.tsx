"use client";
import { useEffect, useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { CurrencyApi } from "models/API/market/CurrencyApi";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import ProductCard from "components/Server/ProductCard";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { EnableScroll } from "utils/tinyUtils";
import auth from "services/auth";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";

function ProductsInfiniteScroll({
  offset,
  currency,
  activeColor,
  analyticsData,
  parsedFilters,
  isFeatured,
  isFlashDeals,
  boutique,
}: {
  offset: any;
  currency: CurrencyApi["data"]["currency"];
  analyticsData: any;
  activeColor: string;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  parsedFilters: any;
  boutique?: any;
}) {
  const { resetBoutique } = useAppStore();
  const { lang }: { lang: string } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };

  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
    GAevent({
      action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
      params: {
        items: analyticsData,
        item_list_name: getItemsListName(),
        screen_name: GA_GLOBAL_SCREEN.FILTERS_SCREEN,
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

  const [products, setProducts] = useState([]);
  const [offsetValue, setOffsetValue] = useState(offset);
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

    const response = await getProductsAndFiltersFromElastic({
      country: lang.split("-")[0],
      language_code: languageVariable,
      filters: parsedFilters,
      limit: 10,
      search_after: offsetValue,
    });
    if (!response) {
      showErrorNotification(
        translateFunction("Failed To Load Products Retring in 3 seconds")
      );
      setTimeout(() => {
        getProductsReq();
      }, 3000);
      return;
    }
    if (!areArraysEqual(offsetValue, response.offset)) {
      setProducts([...products, ...response.products]);
      if (response.products?.length > 0) {
        GAevent({
          action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
          params: {
            items: response?.products?.map((s) => ({
              item_id: s?.product_id,
              item_name: s?.name,
              category: s?.category?.name,
              category_id: s?.category?.id,
              brand: s?.brand?.name,
              brand_id: s?.brand?.id,
            })),
            item_list_name: getItemsListName(),
            user_id_custom: auth.UserID(),
            screen_name: GA_GLOBAL_SCREEN.FILTERS_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      }
    }
    setOffsetValue(response.offset);
    setLoading(false);

    if (
      response.products.length === 0 ||
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
    if (parsedFilters?.boutiques?.length === 1) {
      return `${boutique?.name}-Boutique-Page`;
    } else return "Filters-Page";
  };
  return (
    <>
      {products?.map((product, key) => {
        let color_name = product?.colors?.find(
          (s) => s.color === activeColor
        )?.name;
        let productColor = product?.sync_color_images?.find(
          (s) => s.color_name === color_name
        );
        return (
          <ProductCard
            key={key}
            product={product}
            params={{ lang }}
            currency={currency}
            productColor={productColor}
          />
        );
      })}

      {/* {products.length === 0 &&
                   (
                    <div className="flex p-3 h-10 justify-center items-center light text-[#5d5d5d] text-[14px]">
                      {translate("No Results Found")}
                    </div>
                  )} */}
      {
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
      }
    </>
  );
}

export default ProductsInfiniteScroll;
