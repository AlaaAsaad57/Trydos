"use client";
import React, { useMemo } from "react";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";
import { CoverEffectSliderPropsType } from "models/componentType/CoverEffectSliderPropsType";
import ImageAvatar from "./ImageAvatar";
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

  // --- Rebuild array with first element in the middle ---
  const rearrangedImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    const [first, ...rest] = images;
    const middleIndex = Math.floor(rest.length / 2);
    const newArray = [
      ...rest.slice(0, middleIndex),
      first,
      ...rest.slice(middleIndex),
    ];
    return newArray;
  }, [images]);

  // Find new index of the first element (which we placed in the middle)
  const initialIndex = useMemo(() => {
    if (!images || images.length === 0) return 0;
    return Math.floor((images.length - 1) / 2);
  }, [images]);

  return (
    <div
      className="product-photos-slider min-w-full h-[20px] bg-transparent  max-w-[176px] w-auto left-0 right-0 m-0 z-[9999999] cursor-pointer hover:scale-125 transition-all origin-bottom top-[274px] overflow-hidden flex absolute align-center justify-center"
      data-cy="productPhotoSlider"
      onClick={handleClick}
      style={{ opacity: "1", zIndex: "10" }}
    >
      <div
        className="avatar-slider mx-auto my-0 !w-fit"
        onClick={handleClick}
        onTouchEnd={handleClick}
        onMouseUp={handleClick}
        onMouseDown={handleClick}
      ></div>
    </div>
  );
}

export default CoverEffectSlider;
