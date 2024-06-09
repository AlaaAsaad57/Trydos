import React from "react";
import Skeleton from "react-loading-skeleton";

function DetailsSekeleton() {
  return (
    <>
      <div className="product-details-slider">
        <div className="embla">
          <div className="embla__container">
            <div className="embla__slide">
              <Skeleton width={320} height={464} />
            </div>
            <div className="embla__slide">
              <Skeleton width={320} height={464} />
            </div>
            <div className="embla__slide">
              <Skeleton width={320} height={464} />
            </div>
            <div className="embla__slide">
              <Skeleton width={320} height={464} />
            </div>
          </div>
        </div>
      </div>
      <div className="product-details-footer">
        <div className="product-info-container">
          <div className="product-info-price">
            <div className="product-old-price">
              <Skeleton count={1} />
            </div>
          </div>
          <div className="product-info-properties">
            <Skeleton width={200} count={1} />
          </div>
        </div>
        <div className="product-options-container">
          <Skeleton width={97} height={70} borderRadius={"15"} />
          <div className="options-container">
            <div className={`product-option-item`}>
              <Skeleton width={30} height={52} borderRadius={"15"} />
            </div>
            <div className="product-option-item">
              <Skeleton width={30} height={52} borderRadius={"15"} />
            </div>
            <div className={`product-option-item`}>
              <Skeleton width={30} height={52} borderRadius={"15"} />
            </div>
            <div className="product-option-item">
              <Skeleton width={30} height={52} borderRadius={"15"} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DetailsSekeleton;
