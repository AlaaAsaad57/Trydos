"use client";
import { useParams } from "next/navigation";

import { getConfiguredImage, RoundPrice } from "utils/functions";
import "styles/productDetails.css";
import "styles/product-body.css";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";

import { DisableScroll, GetImageUrl } from "utils/tinyUtils";
import { useEffect } from "react";

function ProductLoader({ product }) {
  const { lang } = useParams();
  // @ts-ignore
  const safePriceCheck = (p) => {
    if (isNaN(p)) {
      return false;
    }
    return true;
  };
  const { currency } = useAppStore();

  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  const isRtl = languageVariable === "ar" || languageVariable === "ku";

  // Must warm the exact URL the gallery renders: same first-image pick as
  // ProductPhotoSliderWrapper's getImages() (sync-color set wins over raw
  // images) and the same 500x700 transform, so the slider's first photo is
  // already in the browser cache when the real page arrives.
  const firstGalleryImage =
    product?.sync_color_images?.[0]?.images?.[0] ??
    product?.images?.[0] ??
    product?.image;
  const firstImageSrc = getConfiguredImage({
    src: GetImageUrl(firstGalleryImage),
    width: 500,
    height: 700,
  });

  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <div className="product-details-container w-full relative bg-[#ffffff] max-h-[calc(100vh-100px)]">
        <div className="product-details-slider mt-[12px] relative h-[474px] max-h-[474px]">
          <div className="embla flex flex-row">
            <div
              className={`embla__container gap-[4px] ${
                isRtl ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div>
                <div
                  className={`embla__slide gap-[4px] product-slider-images relative flex-row`}
                >
                  {firstImageSrc ? (
                    <Image
                      className={`rounded-[15px] w-[320px] h-[464px]`}
                      width={320}
                      height={464}
                      loading={"eager"}
                      alt={product?.name || ""}
                      src={firstImageSrc}
                    />
                  ) : (
                    <Skeleton width={320} height={464} borderRadius={15} />
                  )}
                  <Skeleton width={320} height={464} borderRadius={15} />
                  <Skeleton width={320} height={464} borderRadius={15} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
          <div
            className={`${
              isRtl ? "pr-[10px]" : "pl-[10px]"
            } product-info-section bg-[#ffffff] flex-col align-start`}
          >
            <div className="flex-col px-[10px] max-w-full w-full">
              <div
                className={`${
                  isRtl ? "flex-row-reverse" : "flex-row"
                } product-brand-logo flex-row items-center gap-[11px]`}
              >
                {product?.brand?.icon && (
                  <img
                    width={"auto"}
                    height={18}
                    src={GetImageUrl(product.brand.icon)}
                    alt={product.brand.name}
                  />
                )}
              </div>
              <div
                className={`${
                  isRtl ? "flex-row-reverse" : "flex-row"
                } product-text-section  align-center h-auto`}
              >
                <div
                  className={`${
                    isRtl && "dir-rtl"
                  } text-[#1D1D1D] regular capitalize text-[13px]`}
                  data-pw="productName_productPage"
                >
                  {product?.name}
                </div>
              </div>
              <Skeleton width={200} height={13} borderRadius={4} />
              <Skeleton width={200} height={13} borderRadius={4} />
            </div>

            <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
              <div
                className={`product-shipping h-auto  rounded-none p-0 py-[8px]  justify-start product-colors  flex-col align-start relative`}
              >
                <Skeleton width={"100%"} height={75} borderRadius={12} />
              </div>

              {/* Skeleton commenst */}
              <div className="w-full h-[228px] flex-row gap-[8px]">
                {[1, 1, 1].map((s, i) => (
                  <Skeleton key={i} borderRadius={12} width={"85%"} height={"100%"} />
                ))}
              </div>
            </div>

            {/* footer */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductLoader;
