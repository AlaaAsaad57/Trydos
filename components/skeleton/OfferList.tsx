import React from "react";
import Skeleton from "react-loading-skeleton";

function OfferListSkeleton() {
  return (
    <div
      className={`offers-list pb-[184px]  w-full flex-col items-center justify-start mt-[30px] px-[15px] gap-[20px]`}
      data-cy="boutiques"
    >
      <div className="h-[calc((100vw-30px)*235/400)] w-full flex-col flex max-h-[476px] min-h-[235px] relative rounded-[15px]  shadow-[0px_3px_10px_rgb(0,0,0,0.1)]">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="w-full flex-col flex max-h-[476px] min-h-[235px] relative rounded-[15px]  shadow-[0px_3px_10px_rgb(0,0,0,0.1)]">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="h-[calc((100vw-30px)*235/400)] w-full flex-col flex max-h-[476px] min-h-[235px] relative rounded-[15px]  shadow-[0px_3px_10px_rgb(0,0,0,0.1)]">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="h-[calc((100vw-30px)*235/400)] w-full flex-col flex max-h-[476px] min-h-[235px] relative rounded-[15px]  shadow-[0px_3px_10px_rgb(0,0,0,0.1)]">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
    </div>
  );
}

export default OfferListSkeleton;
