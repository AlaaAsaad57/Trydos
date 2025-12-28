import Skeleton from "react-loading-skeleton";
import React from "react";

function ProductPhotosSkeleton({ isRtl }) {
  return (
    <div className="embla">
      <div
        className={`embla__container ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div>
          <div className={`embla__slide product-slider-images relative`}>
            <Skeleton width={320} height={464} borderRadius={15} />
            <Skeleton width={320} height={464} borderRadius={15} />
            <Skeleton width={320} height={464} borderRadius={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPhotosSkeleton;
