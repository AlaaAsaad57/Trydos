import Skeleton from "node_modules/react-loading-skeleton/dist";
import React from "react";

function FeaturedProductsSkeleton() {
  return (
    <div className="flex-col">
      <div
        className="featured-products-container mt-[12px] flex-row justify-start items-center max-w-[1365px] h-[362px] py-[5px] "
        id="featured-products-container"
        data-cy="featured-products-container"
      >
        {Array.from({ length: 5 })?.map((product, key) => (
          <div
            className="max-h-[362px] relative mx-[10px] shadow-md rounded-md"
            data-cy="countProduct"
            key={key}
          >
            <div
              suppressHydrationWarning
              className="product-container  align-center flex-col relative"
            >
              <Skeleton className="min-w-full min-h-[290px] max-h-[290px]" />
              <div className="product-body w-100 flex-col align-start justify-start max-h-[50px] min-h-[50px]">
                <p
                  className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10"
                  data-cy="productName"
                >
                  <Skeleton className="" width={50} height={10} />
                </p>
              </div>
              <div className="product-footer w-100 flex-row align-center max-h-[30px]">
                <div className={`price-label flex`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedProductsSkeleton;
