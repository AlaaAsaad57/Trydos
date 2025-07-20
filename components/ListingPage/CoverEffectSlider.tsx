import React from "react";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";
import { CoverEffectSliderPropsType } from "models/componentType/CoverEffectSliderPropsType";
import ImageAvatar from "./ImageAvatar";
import StackedSlider from "utils/Slider";

function CoverEffectSlider({
  images,
  active,
  setColor,
  isColorSelected,
  activeColor,
  setActiveColor,
  getIndex,
  product_name,
  priority,
}: CoverEffectSliderPropsType) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setColor(true);
  };

  return (
    <div
      className="product-photos-slider top-[276px] no-navigate overflow-hidden flex absolute align-center justify-center"
      data-cy="productPhotoSlider"
      onClick={handleClick}
      style={{
        opacity: active ? "1" : "0",
        zIndex: active ? "10" : "1",
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
          active_index={getIndex}
          max_drag={100}
          min_scale={0.6}
          max_scale={1}
          onSlideChange={(index) => {
            setActiveColor({ ...images[index], index: 0 });
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
                  e.stopPropagation();
                  e.preventDefault();
                  setColor(true);
                  setActiveColor(images[index]);
                }}
                className="image-avatar bg-white overflow-visible w-100 rounded-50 flex relative cursor-pointer no-navigate"
                style={{
                  width: isColorSelected ? "35px" : "22px",
                  height: isColorSelected ? "35px" : "22px",
                }}
              >
                <ImageAvatar
                  width={35}
                  height={35}
                  isActive={activeColor.color_name === img.color_name}
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
