import React from "react";
import Skeleton from "react-loading-skeleton";

const OrderDetailsSkeleton = () => {
  return (
    <div
      className="flex flex-col items-center justify-center p-10 min-h-[500px] max-w-4xl mx-auto w-full"
      aria-label="Loading..."
      role="status"
    >
      <div className="flex flex-row gap-6 w-full mb-8">
        {[1, 2, 3].map((_, idx) => (
          <Skeleton key={idx} height={60} className="rounded-lg flex-1" />
        ))}
      </div>
      <div className="w-full mb-8">
        <Skeleton height={80} className="rounded-lg w-full" />
      </div>
      <div className="flex flex-row gap-6 w-full mb-8">
        {[1, 2].map((_, idx) => (
          <Skeleton key={idx} height={60} className="rounded-lg flex-1" />
        ))}
      </div>
      <div className="w-full mb-8">
        <Skeleton height={80} className="rounded-lg w-full" />
      </div>
      <div className="w-3/5 mb-8">
        <Skeleton height={60} className="rounded-lg w-full" />
      </div>
      <div className="flex flex-row gap-6 w-full">
        {[1, 2, 3, 4].map((_, idx) => (
          <Skeleton key={idx} height={32} className="rounded-lg flex-1" />
        ))}
      </div>
    </div>
  );
};

export default OrderDetailsSkeleton; 
