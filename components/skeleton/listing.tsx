import "styles/listing-components.css";
import React from "react";
import Skeleton from "react-loading-skeleton";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
function ListingSkeleton({
  forProducts,
  withBanners,

  boutique,
  isForSearch,
}: {
  forProducts?: boolean;
  withBanners?: boolean;
  boutique?: any;
  isForSearch?: boolean;
}) {
  return (
    <>
      {forProducts !== true && withBanners && (
        <>
          {!isForSearch && (
            <div className="filter-listing-bar relative flex-row align-center">
              <div className="back-icon">
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
          )}
          <div className={`boutique-header flex-col align-center`}>
            <div className="boutique-top-info flex-col">
              <div className="boutique-logo-container flex-row align-center">
                {boutique?.icon ? (
                  <>
                    <img width={130} height={20} src={boutique?.icon} />
                    <VerificationIcon />
                    <TopStarIcon />
                  </>
                ) : (
                  <Skeleton
                    className="w-fu"
                    width={130}
                    height={20}
                    borderRadius={"30"}
                  />
                )}
              </div>
              <div className="boutique-text">
                {boutique?.name ? (
                  <>{boutique.name}</>
                ) : (
                  <Skeleton width={200} height={10} />
                )}
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

                    {boutique?.banners && boutique?.banners?.length > 0 ? (
                      <>
                        <Image
                          loading={"eager"}
                          fetchPriority={"high"}
                          style={{ borderRadius: "15px" }}
                          className="OfferImage object-cover"
                          src={getConfiguredImage({
                            src: boutique.banners[0]?.file_path,
                            height: 342,
                            width: 900,
                          })}
                          width={380}
                          unoptimized
                          height={135}
                          alt="offer"
                        />
                      </>
                    ) : (
                      <Skeleton
                        className="w-full h-full"
                        width={380}
                        height={135}
                        borderRadius={"30"}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={`w-full flex-row items-center pl-[15px] mt-[20px]`}>
              {Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="filter-option w-[70px] h-[70px]">
                  <Skeleton
                    width={70}
                    height={70}
                    borderRadius={"50%"}
                    className="ml-2"
                  />
                </div>
              ))}
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
