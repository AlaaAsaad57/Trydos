import Skeleton from "react-loading-skeleton";
import React from "react";

// Mirrors the real slider DOM (ProductImagesSlider + ProductPhotoSliderWrapper):
// embla › embla__container › one `embla__slide product-slider-images` per image,
// each wrapped in `relative flex`, so the per-slide min-width (320px) and the
// `.embla__slide:not(:first-child){margin-left:4px}` gaps apply identically and
// the swap to real photos is shift-free.
function ProductPhotosSkeleton({ isRtl }) {
  return (
    <div className="embla">
      <div
        className={`embla__container ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${i === 0 ? "z-99999999" : "z-88"} relative flex`}
          >
            <div className="embla__slide product-slider-images relative">
              <Skeleton
                width={320}
                height={464}
                borderRadius={15}
                style={{ display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductPhotosSkeleton;
