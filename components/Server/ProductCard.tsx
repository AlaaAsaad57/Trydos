import NextLink from "components/global/NextLink";
import React, { Suspense } from "react";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { BuyButtonProduct, ProductPhotosSlider } from "../ListingPage/Product";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import ProductBanner from "components/products/ProductBanner";

function ProductCard({
  product,
  params,
  currency,
  productColor,
  key,
  language = "en",
}) {
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
        <ProductBanner
          featured={product.featured}
          flashDeals={product.flash_deal_end_date}
          labels={product.label_names}
        />
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
            {product?.brand?.icon && typeof product.brand.icon === "string" && (
              <Image
                loading={"eager"}
                src={getConfiguredImage({
                  src: GetImageUrl(product?.brand?.icon),
                  height: 60,
                })}
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
                {product?.category?.flat_photo_path?.file_path?.length > 0 && (
                  <Image
                    loading={"eager"}
                    src={getConfiguredImage({
                      src: GetImageUrl(
                        product?.category?.flat_photo_path?.file_path
                      ),
                      height: 70,
                    })}
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
            {product?.offer_price >= 0 &&
              product?.offer_price !== product.price && (
                <span className="old-price relative f-12 color-dark-gray light-text">
                  {RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
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
              {product?.offer_price >= 0
                ? RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
                  })
                : RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
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
}

export default ProductCard;
