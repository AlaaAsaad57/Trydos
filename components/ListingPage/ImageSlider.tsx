import React from "react";

import { getConfiguredImage } from "utils/functions";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { ImageSliderPropsType } from "models/componentType/ImageSliderPropsType";
import { NormalSlider } from "utils/Slider";

function ImageSlider({
  product_name,
  images,
  showBorder,
}: ImageSliderPropsType) {
  return (
    <NormalSlider
      initialSlide={0}
      slideHeight={290}
      slideWidth={200}
      slidesArray={images?.map((image, index) => index)}
      onSlideChange={(index) => {
        // setActiveImageIndex(index);
      }}
      renderSlide={({ index, slide, isActive }) => {
        const image = images?.[index];
        return (
          <div className="flex w-full h-[290px] relative" key={index}>
            {/* <BorderImage isBig={true} /> */}
            <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
            <Image
              width={380}
              height={580}
              quality={100}
              loading="eager"
              fetchPriority="auto"
              style={{
                borderRadius: "15px",
                zIndex: "3",
                border: showBorder && "1px solid #FF6200",
              }}
              src={getConfiguredImage({
                src: GetImageUrl(image),
                width: 380,
                height: 580,
                q: 100,
              })}
              key={`${product_name}-${image}`}
              className="w-[200px] h-[290px] object-cover object-[top_center]"
              alt={product_name || "alt"}
            />
          </div>
        );
      }}
    />
  );
}

export default ImageSlider;
