"use client";
import { useEffect, useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { CurrencyApi } from "models/API/market/CurrencyApi";
import { useAppStore } from "store";
import { fetchFilteredProducts } from "Server Requests";
import { showErrorNotification } from "store/notifications/reducer";
import ProductCard from "components/Server/ProductCard";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { EnableScroll } from "utils/tinyUtils";
import auth from "services/auth";

function ProductsInfiniteScroll({
  offset,
  currency,
  activeColor,
  productIds,
  isFeatured,
  isFlashDeals,
  analyticsData,
}: {
  offset: any;
  currency: CurrencyApi["data"]["currency"];
  analyticsData: any;
  activeColor: string;
  productIds: string[];
  isFeatured?: boolean;
  isFlashDeals?: boolean;
}) {
  const { resetBoutique, AddToCartOption, settings } = useAppStore();
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
  const params = useParams();
  const [attempt, setAttempt] = useState(0);
  const getProductsReq = async () => {
    if (loading || isReachEnd) return;
    setLoading(true);
    const response = await fetchFilteredProducts(
      languageVariable,
      lang?.split("-")[0],
      params.filters as string[],
      "false",
      "false",
      offsetValue?.toString(),
      null,
      isFeatured,
      isFlashDeals
    );
    if (response.data.isError) {
      showErrorNotification(
        translateFunction("Failed To Load Products Retring in 3 seconds")
      );
      setTimeout(() => {
        getProductsReq();
      }, 3000);
      return;
    }

    setProducts([
      ...products,
      ...response.data.products.filter(
        (newproduct) =>
          products.filter((oldproduct) => oldproduct.id === newproduct.id)
            .length === 0
      ),
    ]);
    if (response.data.products?.length > 0) {
      GAevent({
        action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
        params: {
          items: response.data.products?.map((s) => ({
            item_id: s?.slug,
            item_name: s?.name,
            category: s?.category?.name,
            brand: s?.brand?.name,
          })),
          user_id_custom: auth.UserID(),
          screen_name: GA_GLOBAL_SCREEN.FILTERS_SCREEN,
          screen_path: window.location.pathname,
        },
      });
    }
    setOffsetValue(response.data.offset);
    setLoading(false);
    if (
      response.data.products.length === 0 ||
      offsetValue === response.data.offset
    ) {
      setLoading(false);
      setIsReachEnd(true);
    }
  };

  return (
    <>
      {products?.map((product, key) => {
        if (!productIds.includes(product.slug)) {
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
        }
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
