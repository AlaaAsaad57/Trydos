import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useReducer } from "react";
import ImageSlider from "./ImageSlider";
import PriceLabel from "./PriceLabel";
import BuyButton from "./BuyButton";
import NextLink from "Hooks/NextLink";
import { ProductInterface } from "models/product";
import { Img } from "react-image";
import Skeleton from "react-loading-skeleton";
import { dispatchRouteChangeEvent } from "Hooks/events";
import { useSelector } from "react-redux";
const TopSlider = dynamic(() => import("./TopSlider"), {
  loading: () => (
    <>
      <div className={`top-slider w-100 align-center flex justify-start`}></div>
      <div className="product-photos overflow-visible w-100 align-center flex-col justify-start"></div>
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
  i,
}: {
  product: ProductInterface;
  priority: boolean;
  i: number;
}) {
  const selectedFilters = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
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
    activeImage: product.images[0].file_path,
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });
  const IsComptaibleWithFilter = () => {
    let isSelectedCat,
      isSelectedPrice,
      isSelectedBrand,
      isSelectedSize = false;
    //filter by categories
    if (
      activeFilters.categories.length === 0 &&
      activeFilters.offers.length === 0 &&
      !(activeFilters.prices?.min >= 0) &&
      activeFilters.brands.length === 0 &&
      activeFilters.sizes.length === 0
    ) {
      return true;
    }
    if (activeFilters.categories.length > 0) {
      if (
        product.categories &&
        product.categories.filter((category) => {
          if (
            activeFilters.categories.filter(
              (selected_cat) =>
                // @ts-ignore
                parseInt(selected_cat.id) === parseInt(category.id) ||
                // @ts-ignore
                parseInt(selected_cat) === parseInt(category)
            ).length > 0
          )
            return true;
          else return false;
        }).length > 0
      ) {
        isSelectedCat = true;
      } else {
        isSelectedCat = false;
      }
    } else isSelectedCat = true;
    //filter by brand
    if (activeFilters.brands.length > 0) {
      if (
        product.brand?.id &&
        activeFilters.brands.filter(
          // @ts-ignore
          (brand) =>
            // @ts-ignore
            parseInt(brand.id) === parseInt(product.brand.id) ||
            // @ts-ignore
            parseInt(brand) === parseInt(product.brand.id)
        ).length > 0
      ) {
        isSelectedBrand = true;
      } else {
        isSelectedBrand = false;
      }
    } else {
      isSelectedBrand = true;
    }
    //filter by size

    if (activeFilters.sizes.length > 0) {
      if (!product.variation || product.variation.length === 0) {
        isSelectedSize = false;
      } else {
        if (
          product.variation &&
          product.variation.filter((option) => {
            if (
              activeFilters.sizes.filter((size) => size === option.type)
                .length > 0
            ) {
              return true;
            } else {
              return false;
            }
          }).length > 0
        ) {
          isSelectedSize = true;
        } else {
          isSelectedSize = false;
        }
      }
    } else {
      isSelectedSize = true;
    }
    //filter on price
    if (!activeFilters.prices || !activeFilters.prices?.min) return true;
    if (
      product.price >= parseInt(activeFilters.prices?.min) &&
      product.price <= parseInt(activeFilters.prices?.max)
    ) {
      isSelectedPrice = true;
    } else {
      isSelectedPrice = false;
    }
    return (
      isSelectedBrand && isSelectedCat && isSelectedPrice && isSelectedSize
    );
  };
  if (IsComptaibleWithFilter())
    return (
      <div>
        <NextLink
          suppressHydrationWarning
          // @ts-ignore
          onClick={(e, bool = false) => {
            /* @ts-ignore*/
            if (
              /* @ts-ignore*/

              e.target.closest(".top-slider-enable") ||
              /* @ts-ignore*/

              e.target.closest(".product-photos-slider")
            ) {
              dispatchRouteChangeEvent("completed");
              e.preventDefault();
              return false;
            } else {
              dispatchRouteChangeEvent("start", { to: "products" });
              document.documentElement.style.overflow = "hidden";
              document.documentElement.scrollTop = 0;
            }
          }}
          href={`/products/${product.id}`}
          className="product-container overflow-hidden rounded-15 align-center flex-col relative"
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
            fetchPriority={i === 0 ? "high" : "low"}
            priority={i === 0}
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
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/h_342/f_avif/1708506792?_a=DdATC1RAAZAA0"
            }
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
            className="product-photos overflow-visible w-100 justify-start align-center flex-col"
            style={{
              position: !productState.isActiveTopSlide ? "static" : "absolute",
              opacity: !productState.isActiveTopSlide ? "1" : "0",
              zIndex: !productState.isActiveTopSlide ? "4" : "1",
            }}
          >
            <div
              className={`product-container-slider relative ${
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
                      productState.isColorSelected &&
                      !productState.isActiveTopSlide
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
                    !productState.isColorSelected &&
                    !productState.isActiveTopSlide
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
            className="product-body w-100 flex-col align-start justify-start"
            suppressHydrationWarning
            onMouseEnter={() => dispatch({ type: "setColor", payload: false })}
            onTouchStart={() => {
              dispatch({ type: "setColor", payload: false });
              dispatch({ type: "setActiveTopSlide", payload: false });
            }}
          >
            <p className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10">
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
                <span className="product-category-icon align-center">
                  <span
                    style={{ display: "inline" }}
                    className="justify-start quantity flex f-10 align-center med-text"
                  >
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
          <div className="product-footer w-100 flex-row absolute align-center">
            <PriceLabel
              offer_price={product.offer_price}
              price_formatted={product.price_formatted}
            />
            <BuyButton />
          </div>
        </NextLink>
      </div>
    );
  else return <></>;
}

export default Product;
