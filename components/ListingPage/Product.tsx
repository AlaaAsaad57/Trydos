import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useReducer } from "react";
import { getConfiguredImage } from "utils/functions";
import ImageSlider from "./ImageSlider";
import PriceLabel from "./PriceLabel";
import BuyButton from "./BuyButton";
import NextLink from "Hooks/NextLink";
import { ProductInterface } from "models/product";
import { Img } from "react-image";
import Skeleton from "react-loading-skeleton";
const TopSlider = dynamic(() => import("./TopSlider"), {
  loading: () => (
    <>
      <div className={`top-slider`}></div>
      <div className="product-photos"></div>
    </>
  ),
});
const CoverEffectSlider = dynamic(() => import("./CoverEffectSlider"));
const ColorSlider = dynamic(() => import("./ColorSlider"));
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
      if (co.color_name === productState.activeColor.color_name) index = ind;
    });
  return index;
};

function Product({
  product,
  priority,
}: {
  product: ProductInterface;
  priority: boolean;
}) {
  const [productState, dispatch] = useReducer(ProductReducer, {
    isActiveTopSlide: false,
    activeColor: product.sync_color_images
      ? {
          ...product.sync_color_images.filter(
            (color) => color.images.length > 0
          )[
            Math.round(
              product.sync_color_images.filter(
                (color) => color.images.length > 0
              ).length / 2
            ) - 1
          ],
          index: 0,
        }
      : { images: product.images },
    activeImage: product.images[0],
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });

  return (
    <NextLink
      suppressHydrationWarning
      href={`/products/${product.slug}`}
      className="product-container"
      onMouseLeave={() => {
        if (productState.isActiveTopSlide || productState.isColorSelected) {
          dispatch({ type: "setActiveTopSlide", payload: false });
          dispatch({ type: "setColor", payload: false });
        }
      }}
    >
      <Image
        fill
        alt={product.name}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        priority={priority}
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
          borderRadius: "15px",
          zIndex: "1",
          objectFit: "cover",
          objectPosition: "center",
        }}
        unoptimized
        src={getConfiguredImage({
          height: 400,
          width: 400,
          src: productState.activeColor.images[0],
        })}
      />
      <div className="offer-blured" />
      {productState.isActiveTopSlide && (
        <TopSlider
          product_name={product.name}
          active={productState.isActiveTopSlide}
          activeColor={productState.activeColor}
          setActiveColor={(e) =>
            dispatch({ type: "setActiveColor", payload: e })
          }
          images={productState?.activeColor?.images}
        />
      )}
      <div
        className="product-photos"
        style={{
          position: !productState.isActiveTopSlide ? "static" : "absolute",
          opacity: !productState.isActiveTopSlide ? "1" : "0",
          zIndex: !productState.isActiveTopSlide ? "4" : "1",
        }}
      >
        <div
          className={`product-container-slider ${
            productState.isColorSelected && "selected-color"
          }`}
        >
          {product.sync_color_images &&
            productState.isColorSelected &&
            !productState.isActiveTopSlide && (
              <ColorSlider
                product_name={product.name}
                priority={priority}
                active={
                  productState.isColorSelected && !productState.isActiveTopSlide
                }
                activeColor={productState.activeColor}
                colors={product.sync_color_images.filter(
                  (color) => color.images.length > 0
                )}
                getIndex={getIndex(product, productState)}
                setActiveColor={(e) =>
                  dispatch({ type: "setActiveImage", payload: e })
                }
              />
            )}
          {
            <ImageSlider
              priority={priority}
              product_name={product.name}
              renderVar={productState.renderVar}
              active={
                !productState.isColorSelected && !productState.isActiveTopSlide
              }
              isActiveTopSlide={productState.isActiveTopSlide}
              setActiveTopSlide={(e) =>
                dispatch({ type: "setActiveTopSlide", payload: e })
              }
              setColor={(e) => dispatch({ type: "setColor", payload: e })}
              activeColor={productState.activeColor}
              isColorSelected={productState.isColorSelected}
              setActiveImage={(e) =>
                dispatch({ type: "setActiveImage", payload: e })
              }
            />
          }
          {product.sync_color_images && (
            <>
              <CoverEffectSlider
                priority={priority}
                product_name={product.name}
                active={!productState.isActiveTopSlide}
                setColor={(e) => {
                  dispatch({ type: "setColor", payload: e });
                }}
                isColorSelected={productState.isColorSelected}
                activeColor={productState.activeColor}
                setActiveColor={(e) =>
                  dispatch({ type: "setActiveColor", payload: e })
                }
                images={product.sync_color_images.filter(
                  (color) => color.images.length > 0
                )}
              />
            </>
          )}
        </div>
      </div>

      <div
        className="product-body"
        suppressHydrationWarning
        onMouseEnter={() => dispatch({ type: "setColor", payload: false })}
        onTouchStart={() => {
          dispatch({ type: "setColor", payload: false });
          dispatch({ type: "setActiveTopSlide", payload: false });
        }}
      >
        <p className="prouct-details">
          {product.brand?.image && (
            <Img
              suppressHydrationWarning
              loader={<Skeleton width={50} height={7} borderRadius={3} />}
              unloader={<span suppressHydrationWarning></span>}
              loading={priority ? "eager" : "lazy"}
              src={product.brand?.image.replace(
                "/upload",
                "/upload/h_50/q_auto"
              )}
              width={16}
              height={7}
              alt={product.name}
            />
          )}
          {product.name.substring(0, 50)}

          {product.category && (
            <span className="product-category-icon">
              <span style={{ display: "inline" }} className="quantity">
                1
              </span>
              {product.category?.icon && (
                <Img
                  suppressHydrationWarning
                  loader={
                    <Skeleton width={10} height={10} borderRadius={"50%"} />
                  }
                  unloader={<span></span>}
                  loading={priority ? "eager" : "lazy"}
                  src={product.category?.icon.replace(
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
                />
              )}
            </span>
          )}
        </p>
      </div>
      <div className="product-footer">
        <PriceLabel
          offer_price={product.offer_price}
          price_formatted={product.price_formatted}
        />
        <BuyButton />
      </div>
    </NextLink>
  );
}

export default Product;
