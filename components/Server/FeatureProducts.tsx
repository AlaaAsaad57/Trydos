import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import {
  BuyButtonProduct,
  ProductPhotosSlider,
} from "components/ListingPage/Product";
import React, { Suspense } from "react";
import { RoundPrice } from "utils/functions";

async function FeatureProducts({ lang }) {
  const getFeaturedProducts = async () => {
    try {
      const featuredProducts = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + `/api/${lang}/featured`
      );
      let data = await featuredProducts.json();
      return data;
    } catch (e) {
      console.log(e);
      return { data: { products: [] } };
    }
  };
  const GetCurrencyData = async () => {
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${lang}/currency`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CURRENCY),
          },
        }
      );
      let data = await response.json();
      return data.data.currency;
    } catch (error) {
      console.log(error, "getCurrencyData", response);
      return {};
    }
  };
  const [featuredProducts, currency] = await Promise.all([
    getFeaturedProducts(),
    GetCurrencyData(),
  ]);
  if (featuredProducts?.data?.products === 0) return <></>;
  return (
    <HortiznalScrollBar
      className="featured-products-container w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-[362px] py-[5px] "
      id="featured-products-container"
      dataCy="featured-products-container"
    >
      {featuredProducts?.data?.products?.map((product, key) => (
        <div
          className="max-h-[362px] relative mx-[10px]"
          data-cy="countProduct"
          key={product.slug}
        >
          <NextLink
            data={{
              is_product: true,
              ...product,
            }}
            ariaLabel={`go to product ${product.slug} ${lang}`}
            suppressHydrationWarning
            href={`/${lang}/products/${product.slug}`}
            className="product-container  align-center flex-col relative"
            data-cy="on_mouse_over_product"
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
                  lang.split("-")[1] === "ar" && "dir-rtl"
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
      ))}
    </HortiznalScrollBar>
  );
}

export default FeatureProducts;
