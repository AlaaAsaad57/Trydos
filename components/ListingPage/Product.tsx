"use client";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import ImageSlider from "./ImageSlider";
import BuyButton from "./BuyButton";
import CoverEffectSlider from "./CoverEffectSlider";
import { useAppStore } from "store";
import { ProductPhotosSliderPropsType } from "models/componentType/ProductPhotosSliderPropsType";
import RedeemButton from "./RedeemButton";
import Image from "node_modules/next/image";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { getCookie } from "utils/cookies/cookie-manager";
import BottomSheet from "components/global/BottomSheet";

function ProductReducer(state, { type, payload }) {
  if (type === "setActiveTopSlide") {
    return {
      ...state,
      isActiveTopSlide: payload,
    };
  }
  if (type === "setActiveColor") {
    return {
      ...state,
      activeColor: { ...payload, index: payload.index || 0 },
      renderVar: !state.renderVar,
    };
  }
  if (type === "setActiveImage") {
    return {
      ...state,
      activeColor: payload,
      renderVar: !state.renderVar,
    };
  }
  if (type === "setColor") {
    return {
      ...state,
      isColorSelected: payload,
    };
  }
}
const getIndex = (product, productState) => {
  let index = 0;
  product.sync_color_images
    .filter((color) => color.images.length > 0)
    .map((co, ind) => {
      if (co.color_name === productState?.activeColor.color_name) index = ind;
    });

  return index;
};
export const BuyButtonProduct = ({
  product,
  params,
  currency,
  language,
  isForColor = false,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [shouldShowRedeem, setShouldShowRedeem] = useState(false);
  const { setSelectedProductForCart, ColorBottomSheet, setColorBottomSheet } =
    useAppStore();
  const shouldShowRedeemFunc = useCallback(() => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redemed_ids = redeemed_products_ids;
      return !parsed_redemed_ids.find((s) => s.id === product.product_id);
    }
    return true;
  }, []);
  useEffect(() => {
    setTimeout(() => {
      if (!shouldShowRedeem) {
        setIsClient(true);
        setShouldShowRedeem(shouldShowRedeemFunc());
      }
    }, 1000);
  }, []);

  const addToCart = () => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    if (isForColor) {
      setSelectedProductForCart({
        ...product,
        activeColor: product.sync_color_images[0]?.color_option,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
        singleColor: true,
      });
    } else
      setSelectedProductForCart({
        ...product,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
      });
  };

  const RenderPrice = () => {
    if (product.is_redeem && shouldShowRedeem) {
      if (product.offer_price >= 0 && product.offer_price !== product.price) {
        return (
          <>
            <span className="old-price relative f-12 text-[#3c3c3c] light-text">
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
            <span className="old-price ml-[3px] relative bold-text color-dark-gray flex f-12">
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
                  strokeLinecap="round"
                  stroke="#ff6200"
                  strokeWidth="1"
                />
              </svg>
            </span>
          </>
        );
      } else {
        return (
          <span className="old-price ml-[3px] bold-text color-dark-gray flex f-12">
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
                strokeLinecap="round"
                stroke="#ff6200"
                strokeWidth="1"
              />
            </svg>
          </span>
        );
      }
    }
    if (product?.offer_price >= 0 && product.price >= 0) {
      if (product.offer_price >= 0 && product?.offer_price !== product.price) {
        return (
          <>
            <span className="old-price relative f-12 text-[#3c3c3c] light-text">
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
          </>
        );
      } else {
        return (
          <span className="old-price relative f-12 bold-text color-dark-gray">
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: 0,
              language: language,
            })}
          </span>
        );
      }
    }
  };

  if (!isClient) return <></>;
  return (
    <>
      <div className="product-footer absolute w-100 flex-row align-center max-h-[30px]">
        <div
          className={`${
            params.lang.split("-")[1] === "ar" && "dir-rtl"
          } price-label flex`}
        >
          {RenderPrice()}
          <span className="currency-label light-text color-dark-gray flex f-10">
            {currency?.symbol}
          </span>
        </div>
      </div>
      {product.is_redeem && shouldShowRedeem && (
        <>
          <RedeemButton />
        </>
      )}
      <BuyButton
        onExpire={() => {
          setShouldShowRedeem(false);
        }}
        id={product.product_id}
        redeem_price={product.redeem_price}
        currency={currency}
        shouldShowRedeem={shouldShowRedeem && product?.is_redeem}
        buy={(e) => {
          // @ts-ignore
          addToCart();
        }}
      />
    </>
  );
};
export function ProductPhotosSlider({
  product,
  priority,
  Sliders = true,
}: ProductPhotosSliderPropsType) {
  const [productState, dispatch] = useReducer(ProductReducer, {
    isActiveTopSlide: false,
    activeColor:
      product.sync_color_images &&
      product.sync_color_images[0]?.images?.length > 0
        ? product.sync_color_images[0]
        : {
            images: product.images,
          },
    // @ts-ignore
    activeImage:
      product?.sync_color_images &&
      product?.sync_color_images[0]?.images?.length > 0
        ? // @ts-ignore
          product?.sync_color_images[0]?.images[0]?.file_path
        : product.images?.[0].file_path,
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });
  const { setColorBottomSheet } = useAppStore();
  if (!Sliders) {
    return (
      <React.Fragment>
        {/* <BorderImage isBig={true} /> */}
        <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute" />

        <Image
          width={400}
          height={300}
          loading="eager"
          fetchPriority="auto"
          src={getConfiguredImage({
            src: GetImageUrl(product.images[0].file_path),
            width: 400,
            height: 400,
          })}
          style={{
            border: product.flash_deal_end_date && "1px solid #FF6200",
          }}
          key={`${product.name}-${0}`}
          className="w-[200px] h-[290px] border-[#d3d3d387] border-[1px] rounded-15 z-10"
          alt={product.name || "alt"}
        />
      </React.Fragment>
    );
  }
  return (
    <>
      <div
        className="product-photos max-h-[290px] overflow-visible w-100 justify-start align-center flex-col"
        style={{
          position: !productState?.isActiveTopSlide ? "static" : "absolute",
          opacity: !productState?.isActiveTopSlide ? "1" : "0",
          zIndex: !productState?.isActiveTopSlide ? "4" : "1",
        }}
      >
        <div className={`product-container-slider w-full relative`}>
          {/* {
            product.sync_color_images &&
            productState?.isColorSelected &&
            !productState?.isActiveTopSlide && (
              <ColorSlider
                product_name={product.name}
                priority={priority}
                active={
                  productState?.isColorSelected &&
                  !productState?.isActiveTopSlide
                }
                activeColor={productState?.activeColor}
                colors={product.sync_color_images?.filter(
                  (color) => color.images.length > 0
                )}
                getIndex={getIndex(product, productState)}
                setActiveColor={(e) =>
                  dispatch({ type: "setActiveImage", payload: e })
                }
              />
            )} */}

          <ImageSlider
            priority={priority}
            product_name={product.name}
            flash_deal_end_date={product.flash_deal_end_date}
            renderVar={productState?.renderVar}
            active={
              !productState?.isColorSelected && !productState?.isActiveTopSlide
            }
            isActiveTopSlide={productState?.isActiveTopSlide}
            setActiveTopSlide={(e) =>
              dispatch({ type: "setActiveTopSlide", payload: e })
            }
            setColor={(e) => dispatch({ type: "setColor", payload: e })}
            activeColor={productState?.activeColor}
            isColorSelected={productState?.isColorSelected}
            key={productState?.activeColor?.color_name}
            setActiveImage={(e) =>
              dispatch({ type: "setActiveImage", payload: e })
            }
          />

          {product.sync_color_images?.length > 0 &&
            product.sync_color_images.filter((s) => s.images.length > 0)
              .length > 0 && (
              <>
                <CoverEffectSlider
                  getIndex={getIndex(product, productState)}
                  priority={priority}
                  product_name={product.name}
                  active={!productState?.isActiveTopSlide}
                  setColor={(e) => {
                    setColorBottomSheet(product);
                  }}
                  isColorSelected={productState?.isColorSelected}
                  activeColor={productState?.activeColor}
                  setActiveColor={(e) =>
                    dispatch({ type: "setActiveColor", payload: e })
                  }
                  images={product.sync_color_images?.filter(
                    (color) => color.images.length > 0
                  )}
                />
              </>
            )}
        </div>
      </div>
    </>
  );
}
