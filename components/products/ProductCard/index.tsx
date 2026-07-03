"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getConfiguredImage,
  GetImageUrl,
  getBrandIconImageUrl,
  RoundPrice,
  getVideoUrl,
  getUrlofProduct,
} from "utils/server";
import ProductPhotosWrapper from "components/ServerWrapper/ProductWrapper/ProductPhotosWrapper";
import NextLink from "components/global/NextLink";

import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { OldPrice } from "components/ServerWrapper/ProductWrapper/OldPrice";
import { RenderPrice } from "components/ServerWrapper/ProductWrapper/RenderPrice";
import FlashDealBanner from "components/products/FlashDealBanner";
import ProductButtonWrapper from "components/ServerWrapper/ProductWrapper/ProductButtonWrapper";
import "styles/product-card.css";
import ProductColorsWrapper from "components/clientWrapper/product/ProductColorsWrapper";
import ImageAvatar from "components/ListingPage/ImageAvatar";
import StackedSlider from "components/ServerWrapper/ProductWrapper/StackedColors";
import ProductColorsBottomSheet from "components/ServerWrapper/ProductWrapper/ProductColorsBottomSheet";
import ProductColorsCards from "components/ServerWrapper/ProductWrapper/ProductColorsCards";
import type { ListingProduct } from "types/listing";
import { deriveCardProps, type CardContext } from "./derivedProps";
import { useLuckTimer } from "hooks/useLuckTimer";

interface ProductCardProps extends CardContext {
  product: ListingProduct;
  priority?: boolean;
}

function ProductCard({
  product,
  currency,
  country,
  language,
  sliders,
  sizesFilters,
  fromRecomended,
  priority,
}: ProductCardProps) {
  const p = deriveCardProps(product, {
    currency,
    country,
    language,
    sliders,
    sizesFilters,
    fromRecomended,
  });
  const {
    images,
    videos,
    id,
    color,
    slug,
    name,
    category_tree,
    labels,
    brand,
    is_luck,
    endDate,
    is_flashDeal,
    luck_price,
    price,
    offer_price,
    flash_deal_price,
    Sliders,
    InitialProductData,
    sizes_filters,
  } = p;
  const [inView, setInView] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !is_luck) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [is_luck]);
  const { luckActive, secondsLeft } = useLuckTimer(id, {
    isLuck: Boolean(is_luck),
    visible: inView,
  });
  let isRtl = language === "ar" || language === "ku";
  let isFlash: any = null;
  let flash_price = offer_price ?? price;
  if (is_flashDeal && endDate) {
    const now = new Date();
    const dealEnd = new Date(endDate);
    dealEnd.setHours(23, 59, 59, 999);
    isFlash = now < dealEnd;
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    const difference = endDateObj.getTime() - now.getTime();
    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      isFlash = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
      };
    } else {
      isFlash = null;
    }
  }
  if (isFlash) {
    flash_price = flash_deal_price ?? offer_price ?? price;
  }

  const shouldShowOrangeBorder = () => {
    if (isFlash || is_luck) {
      return true;
    }
    return false;
  };

  const rearrangedImages = () => {
    if (
      !InitialProductData?.sync_color_images ||
      InitialProductData?.sync_color_images.length === 0
    )
      return [];
    const [first, ...rest] = InitialProductData?.sync_color_images;
    const middleIndex = Math.floor(rest.length / 2);
    const newArray = [
      ...rest.slice(0, middleIndex),
      first,
      ...rest.slice(middleIndex),
    ];
    return newArray;
  };
  let initialIndex = 0;
  if (InitialProductData?.sync_color_images?.length > 0) {
    const [first, ...rest] = InitialProductData?.sync_color_images;

    initialIndex = Math.floor(rest.length / 2);
  }

  return (
    <div
      ref={cardRef}
      id={`product_${slug}`}
      className={`${luckActive ? "product_redeem" : ""}  relative flex`}
    >
      {Sliders && (
        <ProductColorsBottomSheet id={id}>
          <ProductColorsCards
            currency={currency}
            shouldShowOrangeBorder={() => shouldShowOrangeBorder()}
            country={country}
            language={language}
            slug={slug}
            InitialProductData={InitialProductData}
          />
        </ProductColorsBottomSheet>
      )}
      {color && (
        <ProductColorsWrapper product={InitialProductData}>
          <StackedSlider
            disableSlide={true}
            initial_index={initialIndex}
            min_scale={0.6}
            max_scale={1}
            overlap_factor={0.4}
            slide_height={35}
            slide_width={35}
            slidesArray={rearrangedImages().map((_, i) => i)}
          >
            {rearrangedImages().map((img, i) => (
              <div
                key={i}
                className="image-avatar bg-white overflow-visible rounded-50 flex cursor-pointer"
                // Note: Width/Height on this child are now controlled by the parent wrapper
              >
                <ImageAvatar
                  priority={true}
                  width={35}
                  height={35}
                  // logic for isActive is optional here as the parent handles visual focus
                  isActive={i === initialIndex}
                  image={getConfiguredImage({
                    src: GetImageUrl(img.images[0]?.file_path),
                    height: 60,
                  })}
                  name={i === initialIndex ? "#FF5F61" : "#1D1D1D"}
                  alt={name}
                />
              </div>
            ))}
          </StackedSlider>
        </ProductColorsWrapper>
      )}
      <NextLink
        fromRecomended={
          fromRecomended
            ? {
                select_item_recommended: id,
                ...fromRecomended,
              }
            : null
        }
        ariaLabel={`go to product ${name} ${language}`}
        href={getUrlofProduct(color, language, country, slug)}
        className="product-container  align-center flex-col relative pb-[12px]"
        data-cy="product_link"
        id={slug}
        data={{
          name: InitialProductData.name,
          images: [
            InitialProductData?.sync_color_images?.[0]?.images?.[0] ??
              InitialProductData?.images?.[0],
          ],
          price: InitialProductData.price,
          is_luck: is_luck,
          offer_price: InitialProductData.offer_price,
          is_product: true,
        }}
      >
        {Sliders ? (
          <div
            className={`product-container-slider h-[290px] duration-300 w-full relative`}
          >
            <ProductPhotosWrapper>
              {videos && videos.length > 0 ? (
                <>
                  {videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="embla__slide shrink-0"
                      style={{
                        width: `${200}px`,
                        height: "100%",
                      }}
                    >
                      <div className="flex w-full h-[290px] relative" key={idx}>
                        <div
                          className={
                            "inset-shadow-img w-[200px] h-[290px] rounded-15 absolute "
                          }
                        />
                        <video
                          src={getVideoUrl(videos[idx], {
                            width: 400,
                            height: 580,
                            end: 10,
                          })}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls={false}
                          style={{
                            border: shouldShowOrangeBorder()
                              ? "1px solid #FF6200"
                              : "1px solid #d3d3d3",
                          }}
                          className={`${
                            is_luck && "product-media-redeem-show"
                          } w-[200px] h-[290px] border-[#d3d3d387] object-cover object-[top_center] border rounded-15 z-10`}
                        />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {images?.map((image, idx) => (
                    <div
                      key={idx}
                      className="embla__slide shrink-0"
                      style={{
                        width: `${200}px`,
                        height: "100%",
                      }}
                    >
                      <div className="flex w-full h-[290px] relative" key={idx}>
                        <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
                        <Image
                          width={400}
                          height={580}
                          loading={priority && idx === 0 ? undefined : "lazy"}
                          quality={70}
                          fetchPriority="auto"
                          sizes="200px"
                          priority={priority && idx === 0}
                          src={getConfiguredImage({
                            src: GetImageUrl(image),
                            width: 400,
                            height: 580,
                          })}
                          style={{
                            border: shouldShowOrangeBorder()
                              ? "1px solid #FF6200"
                              : "1px solid #d3d3d3",
                          }}
                          className={`${
                            is_luck && "product-media-redeem-show"
                          } w-[200px] h-[290px] border-[#d3d3d387] object-cover object-[top_center] border rounded-15 z-10`}
                          alt={name || "alt"}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </ProductPhotosWrapper>
          </div>
        ) : (
          <div
            className="product-photos z-10 min-h-[290px]  max-h-[290px] overflow-visible w-full justify-start align-center flex-col"
            style={{
              position: "static",
              opacity: "1",
              zIndex: "4",
            }}
          >
            <div
              className={`product-container-slider h-[290px] duration-300 w-full relative`}
            >
              <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
              <Image
                width={400}
                height={580}
                quality={70}
                loading={priority ? undefined : "lazy"}
                fetchPriority="auto"
                sizes="200px"
                priority={priority}
                style={{
                  borderRadius: "15px",
                  zIndex: "3",
                  border: Boolean(shouldShowOrangeBorder())
                    ? "1px solid #FF6200"
                    : "1px solid #d3d3d3",
                }}
                src={getConfiguredImage({
                  src: GetImageUrl(images[0]),
                  width: 400,
                  height: 580,
                })}
                className={`${
                  is_luck && "product-media-redeem-show"
                } w-[200px] h-[290px] object-cover object-[top_center]`}
                alt={name || "alt"}
              />
            </div>
          </div>
        )}
        <div
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px] w-full flex-col align-start justify-start max-h-[60px] min-h-[30px]"
        >
          <div
            className="prouct-details max-w-full whitespace-normal inline-block  text-left align-top overflow-hidden  regular-text text-[#3c3c3c] text-[10px] max-h-[28px]"
            data-cy="productName"
          >
            <span className="flex-row align-center justify-start gap-[4px]">
              {brand?.icon ? (
                <img
                  src={getBrandIconImageUrl(brand.icon, {
                    width: 60,
                    height: 30,
                  })}
                  alt={brand.name || "Brand"}
                  className="h-[15px] w-[30px] object-contain inline-block ml-[7px]"
                  loading="lazy"
                  draggable="false"
                />
              ) : (
                <div className="h-[15px] w-[49.358px] bg-gray-200 rounded-sm" />
              )}
              {brand?.is_verified === 1 && (
                <img src="/icons/VerifiedIcon.svg" />
              )}
            </span>
            <p
              className={`${isRtl && "dir-rtl"} truncate w-full max-w-full`}
              data-cy="product-name"
            >
              {[name, ...category_tree?.map((s) => s)]
                ?.filter((s) => typeof s === "string")
                ?.join(" | ")}
            </p>
          </div>
          {labels?.length > 0 && <ProductLabelsAnimated labels={labels} />}
        </div>
        {isFlash && (
          <FlashDealBanner
            initial={isFlash}
            language={language}
            end_data={endDate}
          />
        )}
        <div
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-full flex-row align-center max-h-[30px]"
        >
          <div className={`${isRtl && "dir-rtl"} price-label flex`}>
            {price !== offer_price && offer_price !== 0 && (
              <OldPrice
                price={RoundPrice({
                  num: price,
                  rate: currency?.exchange_rate,
                  points: currency?.decimal_digits,
                })}
              />
            )}

            <RenderPrice
              currency={currency}
              flash_price={flash_price}
              luckActive={luckActive}
              offer_price={offer_price}
              price={price}
            />

            <span className="currency-label light-text color-dark-gray flex f-10">
              {currency?.symbol}
            </span>
          </div>
        </div>
      </NextLink>
      <ProductButtonWrapper
        InitialProductData={InitialProductData}
        slug={slug}
        currency={currency}
        id={id}
        is_luck={is_luck}
        luckActive={luckActive}
        secondsLeft={secondsLeft}
        language={language}
        luck_price={luck_price}
        sizes_filters={sizes_filters}
      />
    </div>
  );
}

export default ProductCard;
