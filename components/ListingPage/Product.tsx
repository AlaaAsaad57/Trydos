"use client";
import React, { useReducer } from "react";
import ImageSlider from "./ImageSlider";
// import { stopProgress } from "next-nprogress-bar";

import BuyButton from "./BuyButton";
import { dispatchRouteChangeEvent } from "utils/events";

import CoverEffectSlider from "./CoverEffectSlider";
import TopSlider from "./TopSlider";
import ColorSlider from "./ColorSlider";

import { useAppStore } from "store";

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
export const BuyButtonProduct = ({ product }) => {
  const { enableAddToCartOption, storeProductBoutique } = useAppStore();

  const addToCart = () => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    storeProductBoutique({ ...product });
    enableAddToCartOption(product);
  };
  return (
    <BuyButton
      buy={(e) => {
        // @ts-ignore

        stopProgress(true);
        addToCart();
        setTimeout(() => {
          dispatchRouteChangeEvent("completed");
          // stopProgress(true);
        }, 2000);
      }}
    />
  );
};
export const ProductPhotosSlider = ({ product, priority }) => {
  const [productState, dispatch] = useReducer(ProductReducer, {
    isActiveTopSlide: false,
    activeColor:
      product.sync_color_images &&
      product.sync_color_images[0]?.images?.length > 0
        ? {
            ...product.sync_color_images?.filter(
              (color) => color.images.length > 0
            )[
              Math.round(
                product.sync_color_images?.filter(
                  (color) => color.images.length > 0
                ).length / 2
              ) - 1
            ],
            index: 0,
          }
        : {
            images:
              product.images?.length > 0
                ? product.images
                : [product.thumbnail.file_path],
          },
    // @ts-ignore
    activeImage:
      product?.sync_color_images &&
      product?.sync_color_images[0]?.images?.length > 0
        ? // @ts-ignore
          product?.sync_color_images[0]?.images[0]?.file_path
        : product.images?.length > 0
        ? // @ts-ignore
          product.images[0]?.file_path
        : product.thumbnail.file_path,
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });
  const isLowEndDevice = () => {
    if (typeof navigator !== "undefined") {
      // @ts-ignore
      const ram = navigator.deviceMemory || 4; // Default to 4GB if unknown
      const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores

      if (ram <= 3 || cores <= 3) {
        return true;
      }
      return false;
    }
  };

  return (
    <>
      {productState?.isActiveTopSlide && (
        <TopSlider
          product_name={product.name}
          active={productState?.isActiveTopSlide}
          activeColor={productState?.activeColor}
          setActiveColor={(e) =>
            dispatch({ type: "setActiveColor", payload: e })
          }
          images={productState?.activeColor?.images}
        />
      )}
      <div
        className="product-photos max-h-[290px] overflow-visible w-100 justify-start align-center flex-col"
        onMouseLeave={() => {
          if (productState?.isActiveTopSlide || productState?.isColorSelected) {
            dispatch({ type: "setActiveTopSlide", payload: false });
            dispatch({ type: "setColor", payload: false });
          }
        }}
        style={{
          position: !productState?.isActiveTopSlide ? "static" : "absolute",
          opacity: !productState?.isActiveTopSlide ? "1" : "0",
          zIndex: !productState?.isActiveTopSlide ? "4" : "1",
        }}
      >
        <div
          className={`product-container-slider relative ${
            productState?.isColorSelected && "selected-color"
          }`}
        >
          {!isLowEndDevice() &&
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
            )}

          <ImageSlider
            priority={priority}
            product_name={product.name}
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
            setActiveImage={(e) =>
              dispatch({ type: "setActiveImage", payload: e })
            }
          />

          {!isLowEndDevice() &&
            product.sync_color_images?.length > 0 &&
            product.sync_color_images.filter((s) => s.images.length > 0)
              .length > 0 && (
              <>
                <CoverEffectSlider
                  priority={priority}
                  product_name={product.name}
                  active={!productState?.isActiveTopSlide}
                  setColor={(e) => {
                    dispatch({ type: "setColor", payload: e });
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
};
export const ProductCardFooter = () => {};
