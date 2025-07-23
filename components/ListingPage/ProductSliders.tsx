import { ProductPhotosSliderPropsType } from "models/componentType/ProductPhotosSliderPropsType";
import React from "react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import ImageSlider from "./ImageSlider";
import CoverEffectSlider from "./CoverEffectSlider";

const getIndex = (product, productState) => {
  let index = 0;
  product.sync_color_images
    .filter((color) => color.images.length > 0)
    .map((co, ind) => {
      if (co.color_name === productState?.activeColor.color_name) index = ind;
    });

  return index;
};
export function ProductPhotosSlider({
  product,
  priority,
  Sliders = true,
}: ProductPhotosSliderPropsType) {
  const showedImages = () => {
    return product.sync_color_images &&
      product.sync_color_images[0]?.images?.length > 0
      ? product.sync_color_images?.[0]?.images?.[0]?.file_path
      : product.images?.[0]?.file_path;
  };

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
          position: "static",
          opacity: "1",
          zIndex: "4",
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
            product_name={product.name}
            slug={product.slug}
            image={showedImages()}
            key={`Color Images Slider`}
          />

          {product.sync_color_images?.length > 0 &&
            product.sync_color_images.filter((s) => s.images.length > 0)
              .length > 0 && (
              <>
                <CoverEffectSlider
                  priority={priority}
                  product_name={product.name}
                  product={product}
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
