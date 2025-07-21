import NextLink from "components/global/NextLink";
import React, { Suspense } from "react";
import { BuyButtonProduct, ProductPhotosSlider } from "../ListingPage/Product";
import Image from "next/image";

import ProductBanner from "components/products/ProductBanner";
import MangoIcon from "public/svg/listing/MangoIcon.svg";
import VerifiedIcon from "public/svg/listing/VerifiedIcon.svg";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";

function ProductCard({
  product,
  params,
  currency,
  productColor,
  language = "en",
  Sliders = true,
}) {
  return (
    <div
      className="max-h-[377px] relative"
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
        className="product-container  align-center flex-col relative pb-[10px]"
        data-cy="product_link"
        id={product.slug}
      >
        <ProductBanner
          featured={product.featured}
          flashDeals={product.flash_deal_end_date}
          labels={product.label_names}
        />
        <Suspense fallback={<div className="min-w-full min-h-[290px]" />}>
          <ProductPhotosSlider
            Sliders={Sliders}
            product={{
              ...product,
              flash_deal_end_date:
                product.flash_deal_end_date || product.is_redeem,
            }}
            priority={true}
          />
        </Suspense>
        <div className="product-body flex-1 mt-[8px] w-100 flex-col align-start justify-start max-h-[60px] min-h-[30px]">
          <p
            className="prouct-details overflow-hidden w-100 regular-text text-[#3c3c3c] text-[10px] max-h-[25px]"
            data-cy="productName"
          >
            <span className="flex-row align-center justify-start gap-[4px]">
              <MangoIcon />
              <VerifiedIcon />
            </span>
            {product.name?.substring(0, 50)}
            {product?.brand && ` | ${product?.brand?.name}`}
            {product?.category && ` | ${product?.category?.name}`}

            <span className="product-category-icon align-center">
              {/* {product.category &&
                product?.category?.flat_photo_path?.file_path?.length > 0 && (
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
                )} */}
            </span>
          </p>
          <ProductLabelsAnimated
            labels={product?.label_names?.map((s) => ({
              text: s,
              color: "#388CFF",
            }))}
          />
        </div>
      </NextLink>

      <BuyButtonProduct
        product={product}
        currency={currency}
        language={language}
        params={params}
      />
    </div>
  );
}

export default ProductCard;
