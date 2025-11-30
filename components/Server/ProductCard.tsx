"use client";
import NextLink from "components/global/NextLink";
import React, { memo, useState } from "react";
import { BuyButtonProduct } from "../ListingPage/Product";
import VerifiedIcon from "public/svg/listing/VerifiedIcon";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { ProductPhotosSlider } from "components/ListingPage/ProductSliders";
import ColorBottomSheet from "components/ListingPage/ColorBottomSheet";
import { useAppStore } from "store";
import { GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GetImageUrl } from "utils/tinyUtils";
import CoverEffectSlider from "components/ListingPage/CoverEffectSlider";
import { useVisibilityTimer } from "hooks/useVisibilityTimer";

function ProductCard({
  product,
  params,
  currency,
  productColor,
  language = "en",
  Sliders = true,
}) {
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
  const { setColorBottomSheet, isNavigating } = useAppStore();
  const [shouldShowRedeemAction, setShouldShowRedeem] = useState(false);
  const [activeColor, setActiveColor] = useState(getImagesOfProducts());
  const [ProductData, setProductData] = useState(product);
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
  const configureRedeemedProducts = () => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? redeemed_products_ids
        : [];
      if (
        !parsed_redeemed_products_ids?.find((s) => s.id === product?.product_id)
      ) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        setProductData({ ...product, is_redeem: false });
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids,
            { id: product?.product_id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id: product?.product_id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setProductData({ ...product, is_redeem: false });
      setCookie("redemed_ids", [
        { id: product?.product_id, showingDate: new Date().toISOString() },
      ]);
    }
  };
  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
    timerRef,
  } = useVisibilityTimer({
    expiryTimestamp: new Date(Date.now() + 50000),
    onExpire: () => {
      if (!isNavigating) {
        configureRedeemedProducts();
        setShouldShowRedeem(false);
      }
    },
  });
  const getDataCy = () => {
    if (product?.flash_deal_end_date) {
      return "product-card-flash-deal";
    }
    if (shouldShowRedeemAction) {
      return "producr-card-redeem";
    }
    return "product-card";
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="relative flex" ref={timerRef}>
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
        data-cy={getDataCy()}
      >
        <NextLink
          ignoreConditionCase={true}
          onClick={() => {
            if (ProductData?.is_redeem) {
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
            sync_color_images: [
              activeColor,
              ...product?.sync_color_images?.filter(
                (s) => s?.color_name !== activeColor?.color_name
              ),
            ],
            images: product?.images,
            href: getUrlofProduct(),
          }}
          ariaLabel={`go to product ${product.name} ${params.lang}`}
          href={getUrlofProduct()}
          className="product-container  align-center flex-col relative pb-[12px]"
          data-cy="product_link"
          id={product.slug}
        >
          <ProductPhotosSlider
            Sliders={Sliders}
            key={activeColor?.color_name}
            product={{
              ...product,
              flash_deal_end_date: product?.flash_deal_end_date,
              is_redeem: ProductData.is_redeem,
            }}
            images={
              activeColor?.images ??
              product?.images ??
              product?.sync_color_images?.flatMap((s) => s.images.map((i) => i))
            }
            shouldshowRedem={ProductData?.is_redeem}
          />

          <div
            style={{
              direction: isRtl ? "rtl" : "ltr",
            }}
            className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px] w-100 flex-col align-start justify-start max-h-[60px] min-h-[30px]"
          >
            <div
              className="prouct-details max-w-full whitespace-normal inline-block  text-left align-top overflow-hidden  regular-text text-[#3c3c3c] text-[10px] max-h-[25px]"
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
                {product?.brand?.is_verified === 1 && <VerifiedIcon />}
              </span>
              <p
                className={`${isRtl && "dir-rtl"} truncate w-full max-w-full`}
                data-cy="product-name"
              >
                {[product?.name, ...product?.categories?.map((s) => s.name)]
                  ?.filter((s) => typeof s === "string")
                  ?.join(" | ")}
              </p>
            </div>
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
          seconds={seconds}
          setShouldShowRedeem={setShouldShowRedeem}
          shouldShowRedeem={shouldShowRedeemAction}
          product={ProductData}
          currency={currency}
          language={language}
          params={params}
        />
      </div>
    </div>
  );
}

export default memo(ProductCard);
