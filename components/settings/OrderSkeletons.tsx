import Skeleton from "node_modules/react-loading-skeleton/dist";
import React from "react";

function OrderSkeletons() {
  return (
    <>
      {Array.from({ length: 8 }).map((s) => (
        <div className="bg-[#f8f8f8] w-full cursor-pointer pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] mt-[10px] flex-col">
          <Skeleton width={"100%"} height={200} borderRadius={15} />
        </div>
      ))}
    </>
  );
}

export default OrderSkeletons;
