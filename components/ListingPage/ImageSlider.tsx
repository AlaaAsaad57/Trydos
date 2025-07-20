"use client";
import React from "react";
import PointsSlider from "./PointsSlider";
import { getConfiguredImage } from "utils/functions";
import Image from "node_modules/next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { ImageSliderPropsType } from "models/componentType/ImageSliderPropsType";
import { NormalSlider } from "utils/Slider";

function ImageSlider({
  renderVar,
  product_name,
  active,
  isColorSelected,
  setActiveImage,
  activeColor,
  isActiveTopSlide,
  setActiveTopSlide,
  setColor,
  priority,
  flash_deal_end_date,
}: ImageSliderPropsType) {
  return (
    <>
      <div className={`active-slider sl-active`}>
        <React.Fragment>
          {/* <BorderImage isBig={true} /> */}
          <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute" />

          <Image
            width={400}
            height={300}
            loading="eager"
            fetchPriority="auto"
            style={{
              borderRadius: "15px",
              zIndex: "3",
              border: flash_deal_end_date && "1px solid #FF6200",
            }}
            src={getConfiguredImage({
              src: GetImageUrl(activeColor?.images[0].file_path),
              width: 400,
              height: 400,
            })}
            key={`${product_name}-${activeColor?.images[0].file_path}`}
            className="w-[200px] h-[290px]"
            alt={product_name || "alt"}
          />
        </React.Fragment>
      </div>
    </>
  );
}

export default ImageSlider;
