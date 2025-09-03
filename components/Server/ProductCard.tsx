"use client";
import NextLink from "components/global/NextLink";
import React, { memo, useState } from "react";
import { BuyButtonProduct } from "../ListingPage/Product";
import VerifiedIcon from "public/svg/listing/VerifiedIcon.svg";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { ProductPhotosSlider } from "components/ListingPage/ProductSliders";
import ColorBottomSheet from "components/ListingPage/ColorBottomSheet";
import { useAppStore } from "store";
import { GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GetImageUrl } from "utils/tinyUtils";
import CoverEffectSlider from "components/ListingPage/CoverEffectSlider";

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
  const getImagesOfProducts = () => {
    if (product.sync_color_images) {
      if (product.sync_color_images?.[0]?.images) {
        return product?.sync_color_images[0];
      } else {
        return {
          images: product?.images,
        };
      }
    } else {
      return { images: product?.images };
    }
  };
  const { setColorBottomSheet } = useAppStore();
  const [shouldShowRedeemAction, setShouldShowRedeem] = useState(false);
  const [activeColor, setActiveColor] = useState(getImagesOfProducts());

  const getUrlofProduct = () => {
    let url = `/${params.lang}/products/${product.slug}`;
    let searchParams = new URLSearchParams();
    if (activeColor?.color_name) {
      searchParams.set("color", activeColor.color_name);
    }
    if ([...searchParams].length > 0) {
      return url + `?${searchParams.toString()}`;
    } else {
      return url;
    }
  };
  const storeCookies = () => {
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
    localStorage.setItem(
      "last-page",
      JSON.stringify({
        url: window.location.pathname,
        productId: product.slug,
        screen: screen_name,
      })
    );
  };

  return (
    <div className="relative flex">
      <ColorBottomSheet
        id={product.product_id}
        setActiveColor={(e) => {
          setColorBottomSheet(null);
          setActiveColor(e);
        }}
        activeColor={activeColor}
      />
      {product.sync_color_images?.length > 0 &&
        product.sync_color_images.filter((s) => s.images.length > 0).length >
          0 && (
          <CoverEffectSlider
            priority={true}
            product_name={product.name}
            product={product}
            images={product.sync_color_images?.filter(
              (color) => color.images.length > 0
            )}
          />
        )}
      <div
        className="max-h-[377px] relative"
        key={product.slug}
        data-cy="product-card"
      >
        <NextLink
          ignoreConditionCase={true}
          onClick={() => {
            if (product?.is_redeem && shouldShowRedeem) {
              let text = document.querySelector(
                `#counter-${product.product_id}`
              )?.textContent;
              if (text) text = text.match(/\d+/)[0];
              if (text?.length)
                localStorage.setItem(
                  "counter",
                  JSON.stringify({
                    counter: text,
                    product_id: product?.product_id,
                  })
                );
            }
            storeCookies();
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
                {product?.brand?.icon?.file_path ? (
                  <img
                    src={GetImageUrl(product.brand.icon)}
                    alt={product.brand.name || "Brand"}
                    className="h-[8px] w-auto object-contain"
                    loading="eager"
                    draggable="false"
                  />
                ) : (
                  <div className="h-[8px] w-[49.358px] bg-gray-200 rounded" />
                )}
                <VerifiedIcon />
              </span>
              {[
                product.category_hierarchy?.main_category?.name,
                product.category_hierarchy?.sub_category?.name,
                product.category_hierarchy?.sub_sub_category?.name,
              ]
                ?.filter((s) => typeof s === "string")
                ?.join(" | ")}
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
            {product?.label_names?.length > 0 && (
              <ProductLabelsAnimated
                labels={product?.label_names?.map((s) => ({
                  text: s,
                  color: "#388CFF",
                }))}
              />
            )}
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
    </div>
  );
}

export default memo(ProductCard);
