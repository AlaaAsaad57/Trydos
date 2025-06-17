"use client";

import { useEffect, useState } from "react";

import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";

import { dispatchRouteChangeEvent } from "utils/events";

import { RoundPrice, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { CurrencyApi } from "models/API/market/CurrencyApi";
import { useAppStore } from "store";
import { getProductsAndFilters } from "store/homepage/cachedActions";
import { BuyButtonProduct, ProductPhotosSlider } from "./Product";
import NextLink from "components/global/NextLink";

function ProductsInfiniteScroll({
  offset,
  boutiqueId,
  currency,
  searchParams,
  activeColor,
  productIds,
  isFeatured,
}: {
  offset: any;
  currency: CurrencyApi["data"]["currency"];
  boutiqueId: string;
  searchParams: any;
  activeColor: string;
  productIds: string[];
  isFeatured?: boolean;
}) {
  const { resetBoutique, AddToCartOption, settings } = useAppStore();
  const { lang }: { lang: string } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };

  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
    resetBoutique();
    setTimeout(() => {
      getProductsReq();
    }, 2000);
  }, []);

  const [products, setProducts] = useState([]);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [loading, setLoading] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);

  const getProductsReq = async () => {
    setLoading(true);
    const response = await getProductsAndFilters({
      lang: languageVariable,
      offset: offsetValue,
      searchParams: searchParams,
      country: lang?.split("-")[0],
      noProducts: false,
      noFilters: true,
      boutiqueId: boutiqueId === "listing" ? null : boutiqueId,
      isFeatured: isFeatured,
    });
    setProducts([
      ...products,
      ...response.data.products.filter(
        (newproduct) =>
          products.filter((oldproduct) => oldproduct.id === newproduct.id)
            .length === 0
      ),
    ]);

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
  const getPrice = (num) => {
    return RoundPrice({
      num: num,
      rate: currency?.exchange_rate || 1,
      points:
        (settings && settings["starting-setting"]?.decimal_point_settings) || 0,
    });
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
            <div
              className="max-h-[362px] relative"
              data-cy="countProduct"
              key={product.slug}
            >
              <NextLink
                data={{
                  is_product: true,
                  ...product,
                  sync_color_images: productColor
                    ? [productColor]
                    : product?.sync_color_images,
                  images: productColor ? productColor.images : product?.images,
                  href: `/${lang}/products/${product.slug}${
                    productColor ? `?color=${productColor.color_name}` : ""
                  }`,
                }}
                ariaLabel={`Product ${product.slug} ${lang}`}
                suppressHydrationWarning
                href={`/${lang}/products/${product.slug}${
                  productColor ? `?color=${productColor.color_name}` : ""
                }`}
                className="product-container  align-center flex-col relative"
                data-cy="product_link"
                // onMouseLeave={() => {
                //   if (productState?.isActiveTopSlide || productState?.isColorSelected) {
                //     dispatch({ type: "setActiveTopSlide", payload: false });
                //     dispatch({ type: "setColor", payload: false });
                //   }
                // }}
              >
                <ProductPhotosSlider
                  product={{
                    sync_color_images: product.sync_color_images,
                    images: product.images,
                  }}
                  priority={key < 3}
                />

                <div className="product-body w-100 flex-col align-start justify-start max-h-[30px] min-h-[30px]">
                  <p
                    className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10"
                    data-cy="productName"
                  >
                    {product?.brand?.icon &&
                      typeof product.brand.icon === "string" && (
                        <img
                          loading={"eager"}
                          src={product?.brand?.icon?.replace(
                            "/upload",
                            "/upload/h_50/q_auto"
                          )}
                          width={16}
                          height={7}
                          alt={product.name}
                          className="max-h-[20px] max-w-[40px]"
                        />
                      )}
                    {product.name.substring(0, 50)}

                    {product.category && (
                      <span className="product-category-icon align-center">
                        <span
                          style={{ display: "inline" }}
                          className="justify-start quantity flex f-10 align-center med-text"
                        >
                          1
                        </span>
                        {product?.category?.flat_photo_path?.file_path?.length >
                          0 && (
                          <img
                            loading={"eager"}
                            src={product?.category?.flat_photo_path?.file_path?.replace(
                              "/upload",
                              "/upload/h_50/f_webp/q_auto"
                            )}
                            width={10}
                            height={10}
                            style={{
                              display: "inline",
                              minWidth: "10px",
                              minHeight: "10px",
                            }}
                            alt={product.name}
                            className="max-h-[20px] max-w-[40px]"
                          />
                        )}
                      </span>
                    )}
                  </p>
                </div>
                <div className="product-footer w-100 flex-row align-center max-h-[30px]">
                  <div
                    className={`${
                      languageVariable === "ar" && "dir-rtl"
                    } price-label flex`}
                  >
                    {product?.offer_price > 0 && (
                      <span className="old-price relative f-12 color-dark-gray light-text">
                        {getPrice(product.price)}
                        <svg
                          className="absolute w-100"
                          xmlns="http://www.w3.org/2000/svg"
                          width="100%"
                          height="1"
                        >
                          <line
                            id="Line_1"
                            data-name="Line 1"
                            x2="100%"
                            transform="translate(0 0.5)"
                            fill="none"
                            stroke="#3c3c3c"
                            strokeWidth="1"
                          />
                        </svg>
                      </span>
                    )}
                    <span className="new-price bold-text color-dark-gray flex f-12">
                      {product?.offer_price > 0
                        ? getPrice(product?.offer_price)
                        : getPrice(product?.price)}
                    </span>
                    <span className="currency-label light-text color-dark-gray flex f-10">
                      {currency?.symbol}
                    </span>
                  </div>
                </div>
              </NextLink>
              <BuyButtonProduct product={product} />
            </div>
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
