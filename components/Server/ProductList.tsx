import "styles/listing.css";
import "styles/globals.css";
import {
  BuyButtonProduct,
  ProductPhotosSlider,
} from "components/ListingPage/Product";
// import ProductsList from "components/ListingPage/ProductsList";
import React, { Suspense } from "react";
import { RoundPrice } from "utils/functions";
import ProductsInfiniteScroll from "components/ListingPage/ProductsList";
import NextLink from "components/global/NextLink";
import { getActiveFilters } from "./FilterList";
import Image from "next/image";

function ProductListServer({
  params,
  searchParams,
  products,
  currency,
  offset,
  colors,
  isFeatured,
}: {
  params: any;
  searchParams: any;
  products: any;
  currency: any;
  offset: any;
  colors: any;
  isFeatured?: boolean;
}) {
  const activeFilters = getActiveFilters(searchParams)?.colors || [];

  let activeColor = colors?.find(
    (s) => s === activeFilters[activeFilters.length - 1]
  );

  return (
    <div
      className={"listing-container relative flex pb-[350px] max-w-[1310px]"}
    >
      {products.map((product, key) => {
        let color_name = product?.colors?.find(
          (s) => s.color === activeColor
        )?.name;
        let productColor = product?.sync_color_images?.find(
          (s) => s.color_name === color_name
        );

        return (
          <div
            className="max-h-[362px] relative"
            key={product.slug}
            data-cy="product-card"
          >
            <NextLink
              data={{
                is_product: true,
                ...product,
                sync_color_images: productColor
                  ? [productColor]
                  : product?.sync_color_images,
                images: productColor ? productColor.images : product?.images,

                href: `/${params.lang}/products/${product.slug}${
                  productColor ? `?color=${productColor.color_name}` : ""
                }`,
              }}
              ariaLabel={`go to product ${product.slug} ${params.lang}`}
              suppressHydrationWarning
              href={`/${params.lang}/products/${product.slug}${
                productColor ? `?color=${productColor.color_name}` : ""
              }`}
              className="product-container  align-center flex-col relative"
              data-cy="product_link"
            >
              <Suspense fallback={<div className="min-w-full min-h-[290px]" />}>
                <ProductPhotosSlider
                  product={{
                    sync_color_images: product.sync_color_images,
                    images: product.images,
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
                      <Image
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
                        <Image
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
                  {product?.offer_price > 0 && (
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
                    {product?.offer_price > 0
                      ? RoundPrice({
                          num: product?.offer_price,
                          rate: currency?.exchange_rate,
                          points: 0,
                        })
                      : RoundPrice({
                          num: product?.price,
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
        productIds={products.map((s) => s.slug)}
        activeColor={activeColor}
        currency={currency}
        offset={offset}
        searchParams={searchParams}
        boutiqueId={params.boutiqueId}
        isFeatured={isFeatured}
      />
    </div>
  );
}

export default ProductListServer;
