import "styles/listing.css";
import "styles/globals.css";
import {
  BuyButtonProduct,
  ProductPhotosSlider,
} from "components/ListingPage/Product";
// import ProductsList from "components/ListingPage/ProductsList";
import React, { Suspense } from "react";
import { RoundPrice, translateFunction } from "utils/functions";
import ProductsInfiniteScroll from "components/ListingPage/ProductsList";
import NextLink from "components/global/NextLink";

function ProductListServer({
  params,
  searchParams,
  products,
  currency,
  offset,
}) {
  return (
    <div
      className={"listing-container relative flex pb-[350px] max-w-[1310px]"}
      data-cy="allCategory"
    >
      {products.map((product, key) => {
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
                href: `/${params.lang}/products/${product.slug}`,
              }}
              ariaLabel={`go to product ${product.slug} ${params.lang}`}
              suppressHydrationWarning
              // @ts-ignore
              // onClick={(e, bool = false) => {
              //   /* @ts-ignore*/
              //   if (
              //     /* @ts-ignore*/
              //     e.target.closest(".top-slider-enable") ||
              //     /* @ts-ignore*/
              //     e.target.closest(".product-photos-slider") ||
              //     /* @ts-ignore*/
              //     e.target.closest(".buy-button") ||
              //     /* @ts-ignore*/
              //     e.target.closest(".inset-shadow-img")
              //   ) {
              //     // stopProgress(true);
              //     dispatchRouteChangeEvent("completed");
              //     return false;
              //   } else {
              //     Sendevent({
              //       event: "button_clicked",
              //       value: "choose_product_button",
              //     });
              //   }
              // }}
              href={`/${params.lang}/products/${product.slug}`}
              className="product-container  align-center flex-col relative"
              data-cy="on_mouse_over_product"
              // onMouseLeave={() => {
              //   if (productState?.isActiveTopSlide || productState?.isColorSelected) {
              //     dispatch({ type: "setActiveTopSlide", payload: false });
              //     dispatch({ type: "setColor", payload: false });
              //   }
              // }}
            >
              <Suspense fallback={<div className="min-w-full min-h-[290px]" />}>
                <ProductPhotosSlider
                  product={{
                    sync_color_images: product.sync_color_images,
                    images: product.images,
                    thumbnail: product.thumbnail,
                  }}
                  priority={key < 3}
                />
              </Suspense>
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
                    params.lang.split("-")[1] === "ar" && "dir-rtl"
                  } price-label flex`}
                >
                  {product?.offer_price >= 0 && (
                    <span className="old-price relative f-12 color-dark-gray light-text">
                      {RoundPrice({
                        num: product?.price,
                        rate: currency?.exchange_rate,
                        points: 0,
                      })}
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
                    {product?.offer_price >= 0 &&
                      RoundPrice({
                        num: product?.offer_price,
                        rate: currency?.exchange_rate,
                        points: 0,
                      })}
                  </span>
                  <span className="currency-label light-text color-dark-gray flex f-10">
                    {currency?.symbol}
                  </span>
                </div>
              </div>
            </NextLink>
            <Suspense fallback={<></>}>
              <BuyButtonProduct product={product} />
            </Suspense>
          </div>
        );
      })}
      <ProductsInfiniteScroll
        currency={currency}
        offset={offset}
        searchParams={searchParams}
        boutiqueId={params.boutiqueId}
      />
    </div>
  );
}

export default ProductListServer;
