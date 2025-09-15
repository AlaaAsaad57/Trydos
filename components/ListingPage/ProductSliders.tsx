import { ProductPhotosSliderPropsType } from "models/componentType/ProductPhotosSliderPropsType";
import React from "react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl, getVideoUrl } from "utils/tinyUtils";
import ImageSlider from "./ImageSlider";

export function ProductPhotosSlider({
  product,
  shouldshowRedem,
  Sliders = true,
  image,
}: ProductPhotosSliderPropsType) {
  if (Sliders) {
    return (
      <React.Fragment>
        {/* <BorderImage isBig={true} /> */}
        <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute" />
        {product.videos && product.videos.length > 0 ? (
          // Display video if available
          <video
            src={getVideoUrl(product.videos[0], { width: 400, height: 400 })}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            style={{
              border:
                (product.flash_deal_end_date || shouldshowRedem) &&
                "1px solid #FF6200",
            }}
            className="w-full object-cover h-[290px] border-[#d3d3d387] border-[1px] rounded-15 z-10"
          />
        ) : (
          // Display first image if no video
          <Image
            width={400}
            height={300}
            loading="eager"
            quality={100}
            fetchPriority="auto"
            src={getConfiguredImage({
              src: GetImageUrl(image),
              width: 189,
              height: 290,
              q: 100,
            })}
            style={{
              border:
                (product.flash_deal_end_date || shouldshowRedem) &&
                "1px solid #FF6200",
            }}
            key={image}
            className="w-[200px] h-[290px] border-[#d3d3d387] border-[1px] rounded-15 z-10"
            alt={product.name || "alt"}
          />
        )}
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
            showBorder={Boolean(product.flash_deal_end_date || shouldshowRedem)}
            product_name={product.name}
            image={image}
            key={`Color Images Slider`}
          />
        </div>
      </div>
    </>
  );
}
