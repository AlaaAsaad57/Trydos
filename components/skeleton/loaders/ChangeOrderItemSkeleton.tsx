import React from "react";
import Skeleton from "react-loading-skeleton";

const ChangeOrderItemSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10 min-h-[500px] max-w-lg">
      <div className="flex justify-center mb-10">
        <Skeleton
          width={120}
          height={120}
          borderRadius={9999}
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex flex-row gap-4 w-full justify-center mb-12">
        <Skeleton width={"100%"} height={48} borderRadius={16} />
        <Skeleton width={"100%"} height={48} borderRadius={16} />
        <Skeleton width={"100%"} height={48} borderRadius={16} />
      </div>

      <div className="flex flex-row gap-8 justify-center w-full mt-4">
        {[1,1,1,1,1,1,1,1].map((_, idx) => (
          <Skeleton
            key={idx}
            width={80}
            height={80}
            borderRadius={9999}
            className="rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

export default ChangeOrderItemSkeleton; 