"use client";
import React from "react";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";
import { CoverEffectSliderPropsType } from "models/componentType/CoverEffectSliderPropsType";
import ImageAvatar from "./ImageAvatar";
import StackedSlider from "utils/Slider";
import { useAppStore } from "store";

function CoverEffectSlider({
  images,
  product,
  product_name,
  priority,
}: CoverEffectSliderPropsType) {
  const { setColorBottomSheet } = useAppStore();
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setColorBottomSheet(product);
  };

  return (
    <div
      className="product-photos-slider cursor-pointer hover:scale-125 transition-all origin-bottom top-[276px]  overflow-hidden flex absolute align-center justify-center"
      data-cy="productPhotoSlider"
      onClick={handleClick}
      style={{
        opacity: "1",
        zIndex: "10",
      }}
    >
      <div
        className="avatar-slider mx-auto my-0 !w-fit"
        onClick={handleClick}
        onTouchEnd={handleClick}
        onMouseUp={handleClick}
        onMouseDown={handleClick}
      >
        <StackedSlider
          disableSlide={true}
          initial_index={0}
          active_index={0}
          max_drag={100}
          min_scale={0.6}
          max_scale={1}
          onSlideChange={(index) => {
            // setActiveColor({ ...images[index], index: 0 });
          }}
          overlap_factor={0.4}
          slide_height={35}
          slide_width={35}
          slidesArray={images.map((s, i) => i)}
          renderSlide={({ index, isActive, slide_width }) => {
            let img = images[index];
            return (
              <div
                data-cy="wrapperPhotoSlider"
                key={index}
                onClick={(e) => {
                  handleClick(e);
                  // setActiveColor(images[index]);
                }}
                className="image-avatar bg-white overflow-visible w-100 rounded-50 flex relative cursor-pointer "
                style={{
                  width: "22px",
                  height: "22px",
                }}
              >
                <ImageAvatar
                  width={35}
                  height={35}
                  isActive={index === 0}
                  image={getConfiguredImage({
                    src: GetImageUrl(img.images[0]?.file_path),
                    height: 60,
                  })}
                  name={isActive ? "#FF5F61" : "#1D1D1D"}
                  alt={product_name}
                  priority={priority}
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export default CoverEffectSlider;
