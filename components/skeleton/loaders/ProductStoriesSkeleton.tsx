import React from "react";
import Skeleton from "react-loading-skeleton";

const ProductStoriesSkeleton = () => (
  <div className="flex justify-center items-center w-full h-[194px]">
    <Skeleton width="100%" height="100%" borderRadius={16} />
  </div>
);

export default ProductStoriesSkeleton; 