"use client";
import NextLink from "components/global/NextLink";
import React, { useCallback, useEffect, useState } from "react";
import { BuyButtonProduct } from "../ListingPage/Product";
import MangoIcon from "public/svg/listing/MangoIcon.svg";
import VerifiedIcon from "public/svg/listing/VerifiedIcon.svg";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { ProductPhotosSlider } from "components/ListingPage/ProductSliders";
import ColorBottomSheet from "components/ListingPage/ColorBottomSheet";
import { useAppStore } from "store";

function ProductCard({
  product,
  params,
  currency,
  productColor,
  language = "en",
  Sliders = true,
}) {
  const shouldShowRedeem = () => {
    if (typeof window === "undefined") return false;
    let redeemed_products_ids = getCookie<any>("redemed_ids");
    if (redeemed_products_ids) {
      let parsed_redemed_ids = redeemed_products_ids;
      return !parsed_redemed_ids.find((s) => s.id === product.product_id);
    }
    return true;
  };
  const { setColorBottomSheet } = useAppStore();
  const [shouldShowRedeemAction, setShouldShowRedeem] = useState(false);
  const [activeColor, setActiveColor] = useState(
    productColor || product?.sync_color_images[0] || { images: product?.images }
  );

  const getUrlofProduct = () => {
    let url = `/${params.lang}/products/${product.slug}`;
    let searchParams = new URLSearchParams();
    if (activeColor?.color_name) {
      searchParams.set("color", activeColor.color_name);
    }
    if (searchParams.values().toArray().length > 0) {
      return url + searchParams.toString();
    } else {
      return url;
    }
  };

  return (
    <>
      <ColorBottomSheet
        id={product.product_id}
        setActiveColor={(e) => {
          setColorBottomSheet(null);
          setActiveColor(e);
        }}
        activeColor={activeColor}
      />
      <div
        className="max-h-[377px] relative"
        key={product.slug}
        data-cy="product-card"
      >
        <NextLink
          onClick={() => {
            if (product?.is_redeem && shouldShowRedeem) {
              let text = document.querySelector(
                `#counter-${product.product_id}`
              )?.textContent;
              text = text.match(/\d+/)[0];
              if (text)
                setCookie(
                  "counter",
                  JSON.stringify({
                    counter: text,
                    product_id: product?.product_id,
                  })
                );
            }
            setCookie("last-page", window.location.pathname);
          }}
          data={{
            is_product: true,
            ...product,
            sync_color_images: [activeColor],
            images: product?.images,
            href: getUrlofProduct(),
          }}
          ariaLabel={`go to product ${product.name} ${params.lang}`}
          href={getUrlofProduct()}
          className="product-container  align-center flex-col relative pb-[10px]"
          data-cy="product_link"
          id={product.slug}
        >
          <ProductPhotosSlider
            Sliders={Sliders}
            product={{
              ...product,
              flash_deal_end_date: false,
              is_redeem: shouldShowRedeem && product.is_redeem,
            }}
            image={
              activeColor.images?.[0]?.file_path || activeColor?.images?.[0]
            }
            priority={true}
          />

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
          setShouldShowRedeem={setShouldShowRedeem}
          shouldShowRedeem={shouldShowRedeemAction}
          product={product}
          currency={currency}
          language={language}
          params={params}
        />
      </div>
    </>
  );
}

export default ProductCard;
