import { useReducer, memo } from "react";
import ImageSlider from "./ImageSlider";
import PriceLabel from "./PriceLabel";
import BuyButton from "./BuyButton";
import TopSlider from "./TopSlider";
import CoverEffectSlider from "./CoverEffectSlider";
import ColorSlider from "./ColorSlider";
import "styles/skeleton.css";
import Loadding from "public/svg/loading.svg";
import CategoryPhoto from "./CategoryPhoto";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import RemoteSvg from "components/global/RemoteSvg";
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
function ProductCover({ product }) {
  const [productState, dispatch] = useReducer(ProductReducer, {
    isActiveTopSlide: false,
    activeColor: {
      ...product.sync_color_images.filter((color) => color.images.length > 0)[
        Math.round(
          product.sync_color_images.filter((color) => color.images.length > 0)
            .length / 2
        ) - 1
      ],
      index: 0,
    },
    activeImage: "",
    isColorSelected: false,
    activeImageIndex: 0,
    renderVar: false,
  });
  const getIndex = () => {
    let index = 0;
    product.sync_color_images
      .filter((color) => color.images.length > 0)
      .map((co, ind) => {
        if (co.color_name === productState.activeColor.color_name) index = ind;
      });
    return index;
  };
  const getImageCld = (s) => {
    if (s.includes("cloudinary")) {
      return s.replace("/upload", "/upload/w_200,h_290/f_avif/q_40");
    } else return s;
  };
  return (
    <div
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
        alt="imageAlt"
        loading="eager"
        unoptimized
        fetchPriority="high"
        priority={true}
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
          borderRadius: "15px",
          zIndex: "1",
          objectFit: "cover",
          objectPosition: "center",
        }}
        src={getConfiguredImage({
          height: 580,
          width: 400,
          src: productState.activeColor.images[0],
        })}
      />
      <div className="offer-blured-background" />
      <div className="offer-blured" />
      {
        <TopSlider
          product_name={product.name}
          active={productState.isActiveTopSlide}
          activeColor={productState.activeColor}
          setActiveColor={(e) =>
            dispatch({ type: "setActiveColor", payload: e })
          }
          images={productState.activeColor.images}
        />
      }
      {
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
            <>
              {
                <ColorSlider
                  product_name={product.name}
                  active={
                    productState.isColorSelected &&
                    !productState.isActiveTopSlide
                  }
                  activeColor={productState.activeColor}
                  colors={product.sync_color_images.filter(
                    (color) => color.images.length > 0
                  )}
                  getIndex={getIndex()}
                  setActiveColor={(e) =>
                    dispatch({ type: "setActiveImage", payload: e })
                  }
                />
              }
            </>
            <>
              {
                <ImageSlider
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
            </>
          </div>
          {
            <>
              <CoverEffectSlider
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
          }
        </div>
      }
      <div
        className="product-body"
        onMouseEnter={() => dispatch({ type: "setColor", payload: false })}
        onTouchStart={() => {
          dispatch({ type: "setColor", payload: false });
          dispatch({ type: "setActiveTopSlide", payload: false });
        }}
      >
        {product.brand?.image ? (
          <RemoteSvg url={product.brand?.image} size={16} isSvg={true} />
        ) : (
          <div className="svg-holder-r" />
        )}
        <div className="prouct-details">
          <span className="quantity">1</span>
          {product.category && (
            <span className="product-category-icon">
              {product.category?.icon && (
                <RemoteSvg
                  isSvg={null}
                  url={product.category?.icon}
                  size={10}
                />
              )}
            </span>
          )}
          <span className="product-details-text">{product.name}</span>
        </div>
      </div>
      <div className="product-footer">
        <PriceLabel
          offer_price={product.offer_price}
          price_formatted={product.price_formatted}
        />
        <BuyButton />
      </div>
    </div>
  );
}

export default memo(ProductCover);
