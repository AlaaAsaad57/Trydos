"use client";
import React from "react";
import { useAppStore } from "store";

function ProductColorsWrapper({
  children,
  product,
}: {
  children: React.ReactNode;
  product: any;
}) {
  const { setColorBottomSheet } = useAppStore();

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setColorBottomSheet(product);
  };

  return (
    <div
      className="product-photos-slider min-w-full h-[20px] bg-transparent  max-w-[176px] w-auto left-0 right-0 m-0 z-9999999 cursor-pointer hover:scale-125 transition-all origin-bottom top-[274px] overflow-hidden flex absolute align-center justify-center"
      data-pw="productPhotoSlider"
      onClick={handleClick}
      style={{ opacity: "1", zIndex: "10" }}
    >
      <div
        className="avatar-slider mx-auto my-0 w-fit!"
        onClick={handleClick}
        onTouchEnd={handleClick}
        onMouseUp={handleClick}
        onMouseDown={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

export default ProductColorsWrapper;
