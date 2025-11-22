import Skeleton from "react-loading-skeleton";
import React from "react";
import { translateFunction } from "utils/functions";

function FeaturedProductsSkeleton({ lang }) {
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full mt-[10px]">
      <div className="flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d]">
        <span></span>
        <span className="ml-[12px]">
          <Skeleton height={18} width={38} borderRadius={5} />
        </span>
      </div>
      <div
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] "
        id="featured-products-container"
      >
        {Array.from({ length: 6 })?.map((product, key) => (
          <div
            className="max-h-[377px] relative"
            data-cy="product-card"
            key={key}
          >
            <div
              suppressHydrationWarning
              className="product-container  align-center flex-col relative pb-[10px]"
              data-cy="product_link"
            >
              <Skeleton width={200} height={377} borderRadius={15} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedProductsSkeleton;
