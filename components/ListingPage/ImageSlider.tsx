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
}: ImageSliderPropsType) {
  return (
    <>
      <div
        className={"active-slider " + (active ? "sl-active" : "sl-deactive")}
      >
        {!isColorSelected && (
          <PointsSlider
            key={product_name}
            colors={activeColor.images}
            activeIndex={activeColor.index >= 0 ? activeColor.index : 0}
            isActiveTopSlide={isActiveTopSlide}
            setActiveTopSlide={() => {
              setActiveTopSlide(!isActiveTopSlide);
              setColor(true);
            }}
          />
        )}

        <NormalSlider
          onSlideChange={(index) => {
            setActiveImage({ ...activeColor, index: index });
          }}
          initialSlide={activeColor.index}
          slidesArray={activeColor?.images?.map((img, index) => index)}
          renderSlide={({ index, isActive, slide }) => {
            let element = activeColor?.images[index];
            return (
              <React.Fragment key={index}>
                {/* <BorderImage isBig={true} /> */}
                <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute" />

                <Image
                  width={400}
                  height={300}
                  loading="eager"
                  fetchPriority="auto"
                  style={{ borderRadius: "15px", zIndex: "3" }}
                  src={getConfiguredImage({
                    src: GetImageUrl(element.file_path),
                    width: 400,
                    height: 400,
                  })}
                  key={`${product_name}-${index}`}
                  className="w-[200px] h-[290px]"
                  alt={product_name || "alt"}
                />
              </React.Fragment>
            );
          }}
          slideHeight={290}
          slideWidth={200}
          threshold={0}
        />
      </div>
    </>
  );
}

export default ImageSlider;
