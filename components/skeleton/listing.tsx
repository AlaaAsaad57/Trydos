import "styles/listing-components.css";
import React from "react";
import Skeleton from "react-loading-skeleton";

function ListingSkeleton({ forProducts }: { forProducts?: boolean }) {
  return (
    <>
      {forProducts !== true && (
        <>
          <div className="filter-listing-bar relative flex-row align-center">
            <div className="back-icon" >
              <Skeleton width={20} height={20} borderRadius={"50%"} />
            </div>
            <div className="filter-bar-options flex-row align-center">
              <div className="filter-option">
                <Skeleton width={20} height={20} borderRadius={"50%"} />
              </div>
              <div className="filter-option">
                <Skeleton width={20} height={20} borderRadius={"50%"} />
              </div>
              <div className="filter-option">
                <Skeleton width={20} height={20} borderRadius={"50%"} />
              </div>
              <div className="filter-option">
                <Skeleton width={20} height={20} borderRadius={"50%"} />
              </div>
            </div>
          </div>
          <div className="boutique-header flex-col align-center">
            <div className="boutique-top-info flex-col">
              <div className="boutique-logo-container flex-row align-center">
                <Skeleton width={130} height={20} borderRadius={"30"} />
              </div>
              <div className="boutique-text">
                <Skeleton width={200} height={10} />
              </div>
            </div>
            <div className="boutique-photo-holder">
              <div className="offer-slider-container">
                <div className="offer-slide-item" style={{ width: "100%" }}>
                  <div className="image-offer">
                    <div
                      className="image-inner-shadow"
                      style={{ height: "100%" }}
                    />

                    <Skeleton width={380} height={135} borderRadius={"30"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="listing-container flex pb-[350px] max-w-[1310px]">
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
    </>
  );
}

export default ListingSkeleton;
