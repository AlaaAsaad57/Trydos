import React from "react";
import Skeleton from "react-loading-skeleton";

function OfferListSkeleton() {
  return (
    <div className={`offers-list pb-[184px]`} data-cy="boutiques">
      <div className="offer-widget">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="offer-widget">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="offer-widget">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="offer-widget">
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
