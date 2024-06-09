import React from "react";
import Skeleton from "react-loading-skeleton";

function ListingSkeleton() {
  return (
    <div className="listing-container flex">
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
        <Skeleton
          width={"100%"}
          style={{ minHeight: "100%" }}
          height={"100%"}
          borderRadius={15}
        />
      </div>
      <div className="product-container rounded-15 align-center flex-col relative">
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

export default ListingSkeleton;
