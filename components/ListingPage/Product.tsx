import React, { useReducer } from "react";
import ImageSlider from "./ImageSlider";

import BuyButton from "./BuyButton";
import NextLink from "components/global/NextLink";
import { ProductInterface } from "models/product";
import { useDispatch, useSelector } from "react-redux";
import { RoundPrice, Sendevent } from "utils/functions";
import dynamic from "next/dynamic";
import CoverEffectSlider from "./CoverEffectSlider";
const PriceLabel = dynamic(() => import("./PriceLabel"), {
  ssr: false,
});
import ColorSlider from "./ColorSlider";
import TopSlider from "./TopSlider";
import { useParams } from "next/navigation";

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

function Product({
  product,
  priority,
  i,
}: {
  product: ProductInterface;
  priority: boolean;
  i: number;
}) {
  const dispatchStore = useDispatch();
  const { lang } = useParams();
  const addToCart = () => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    dispatchStore({
      type: "STORE-PRODUCT-Boutique",
      payload: { ...product },
    });
    dispatchStore({ type: "AddToCartOptionEnable", payload: product });
  };

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
    // @ts-ignore
    activeImage: product?.sync_color_images
      ? // @ts-ignore
        product?.sync_color_images[0]?.images[0]?.file_path
      : // @ts-ignore
        product.images[0]?.file_path,
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });
  const decimal_point_settings = useSelector(
    (state: StateInterface) => state.homepage.settings
  );
  const currency = useSelector(
    (state: StateInterface) => state.homepage.currency
  ) || { exchange_rate: 1 };
  const getPrice = (num) => {
    return RoundPrice({
      num: num,
      rate: currency?.exchange_rate || 1,
      points:
        (decimal_point_settings &&
          decimal_point_settings["starting-setting"]?.decimal_point_settings) ||
        0,
    });
  };
  return (
    <div className="max-h-[362px]" data-cy="countProduct">
      <NextLink
        suppressHydrationWarning
        // @ts-ignore
        onClick={(e, bool = false) => {
          /* @ts-ignore*/
          if (
            /* @ts-ignore*/
            e.target.closest(".top-slider-enable") ||
            /* @ts-ignore*/
            e.target.closest(".product-photos-slider") ||
            /* @ts-ignore*/
            e.target.closest(".buy-button")
          ) {
            return false;
          } else {
            Sendevent({
              event: "button_clicked",
              value: "choose_product_button",
            });
            setTimeout(() => {
              if (document.querySelector("#nprogress"))
                // @ts-ignore
                document.querySelector("#nprogress").style.opacity = "1";
            }, 1000);
          }
        }}
        href={`/${lang}/products/${product.slug}`}
        className="product-container  align-center flex-col relative"
        data-cy="on_mouse_over_product"
        onMouseLeave={() => {
          if (productState?.isActiveTopSlide || productState?.isColorSelected) {
            dispatch({ type: "setActiveTopSlide", payload: false });
            dispatch({ type: "setColor", payload: false });
          }
        }}
      >
        {/* <img
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            borderRadius: "15px",
            zIndex: "1",
            objectFit: "cover",
            objectPosition: "center",
            willChange: "transform",
          }}
          width={200}
          height={290}
          className="h-full w-full"
          src={
            "https://res.cloudinary.com/djooohujg/image/upload/q_50/h_342/f_avif/1708506792?_a=DdATC1RAAZAA0"
          }
        />
        <div className="offer-blured" /> */}
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
            {product.sync_color_images &&
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
                renderVar={productState?.renderVar}
                active={
                  !productState?.isColorSelected &&
                  !productState?.isActiveTopSlide
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
            }

            {product.sync_color_images && (
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
                  images={product.sync_color_images.filter(
                    (color) => color.images.length > 0
                  )}
                />
              </>
            )}
          </div>
        </div>

        <div
          className="product-body w-100 flex-col align-start justify-start max-h-[30px] min-h-[30px]"
          onMouseEnter={() => dispatch({ type: "setColor", payload: false })}
          onTouchStart={() => {
            dispatch({ type: "setColor", payload: false });
            dispatch({ type: "setActiveTopSlide", payload: false });
          }}
        >
          <p
            className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10"
            data-cy="productName"
          >
            {product?.brand?.icon && typeof product.brand.icon === "string" && (
              <img
                loading={priority ? "eager" : "lazy"}
                src={product?.brand?.icon?.replace(
                  "/upload",
                  "/upload/h_50/q_auto"
                )}
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
                  <img
                    loading={priority ? "eager" : "lazy"}
                    src={product?.category?.flat_photo_path?.file_path?.replace(
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
                    className="max-h-[20px] max-w-[40px]"
                  />
                )}
              </span>
            )}
          </p>
        </div>
        <div className="product-footer w-100 flex-row align-center max-h-[30px]">
          <PriceLabel
            offer_price={getPrice(product?.offer_price)}
            price_formatted={getPrice(product.price)}
          />
          <BuyButton
            buy={(e) => {
              // @ts-ignore

              addToCart();
              setTimeout(() => {
                if (document.querySelector("#nprogress"))
                  // @ts-ignore
                  dispatchRouteChangeEvent("completed");
              }, 1000);
            }}
          />
        </div>
      </NextLink>
    </div>
  );
}

export default Product;
