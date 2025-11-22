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
import { getCookie } from "utils/cookies/cookie-manager";

function ProductsInfiniteScroll({
  offset,
  currency,
  activeColor,
  analyticsData,
  parsedFilters,
  isFeatured,
  isFlashDeals,
  boutique,
  prductIds,
}: {
  offset: any;
  currency: CurrencyApi["data"]["currency"];
  analyticsData: any;
  activeColor: string;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  parsedFilters: any;
  boutique?: any;
  prductIds: string[];
}) {
  const { resetBoutique } = useAppStore();
  const { lang }: { lang: string } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
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
      let uniqueArray = [...products, ...(response?.products ?? [])];
      uniqueArray = uniqueArray?.filter(
        (s) => !prductIds?.includes(s.product_id)
      );
      let newArray = Array.from(
        new Map(uniqueArray.map((c: any) => [c.product_id, c])).values()
      );
      const redeemed_ids = getCookie<any[]>("redemed_ids") ?? [];
      let productsData = newArray.map((product) => {
        if (product?.is_redeem) {
          return {
            name: product?.name,
            slug: product?.slug,
            label_names: product?.label_names,
            category_tree: product?.category_tree,
            videos: product.videos,
            colors: product?.colors,
            sync_color_images: product?.sync_color_images,
            ...(!product?.sync_color_images ||
            product?.sync_color_images?.length === 0
              ? { images: product.images }
              : {}),
            price: product.price,
            offer_price: product.offer_price,
            redeem_price: product.redeem_price,
            categories: product?.categories?.map((s) => ({
              name: s.name,
              id: s.id,
            })),
            brand: { id: product?.brand?.id, icon: product?.brand?.icon },
            flash_deal_end_date: product.flash_deal_end_date,

            product_id: product.product_id,
            is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
          };
        } else
          return {
            name: product?.name,
            slug: product?.slug,
            label_names: product?.label_names,
            category_tree: product?.category_tree,
            videos: product.videos,
            colors: product?.colors,
            sync_color_images: product?.sync_color_images,
            ...(!product?.sync_color_images ||
            product?.sync_color_images?.length === 0
              ? { images: product.images }
              : {}),
            price: product.price,
            offer_price: product.offer_price,
            redeem_price: product.redeem_price,
            categories: product?.categories?.map((s) => ({
              name: s.name,
              id: s.id,
            })),
            brand: { id: product?.brand?.id, icon: product?.brand?.icon },
            flash_deal_end_date: product.flash_deal_end_date,
            product_id: product.product_id,
          };
      });
      setProducts(productsData);
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
            screen_name: getScreen(),
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
