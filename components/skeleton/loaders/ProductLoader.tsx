"use client";
import { useParams } from "next/navigation";

import { getConfiguredImage, RoundPrice } from "utils/functions";
import "styles/productDetails.css";
import "styles/product-body.css";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";

import { DisableScroll, GetImageUrl } from "utils/tinyUtils";
import { useEffect } from "react";

function ProductLoader({ product }) {
  const { lang } = useParams();
  // @ts-ignore

  const { currency } = useAppStore();

  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  useEffect(() => {
    DisableScroll();
  }, []);
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
      <div className="product-details-container w-full relative bg-[#ffffff] max-h-[calc(100vh-100px)]">
        <div className="product-details-slider mt-[12px] relative h-[474px] max-h-[474px]">
          <div className="embla flex flex-row">
            <div
              className={`embla__container gap-[4px] ${
                isRtl ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div>
                <div
                  className={`embla__slide gap-[4px] product-slider-images relative flex-row`}
                >
                  <Image
                    className={`rounded-[15px] w-[320px] h-[464px]`}
                    width={320}
                    height={464}
                    loading={"eager"}
                    alt={product.name}
                    src={getConfiguredImage({
                      src: GetImageUrl(product?.images?.[0]),
                      width: 500,
                      height: 700,
                    })}
                  />
                  <Skeleton width={320} height={464} borderRadius={15} />
                  <Skeleton width={320} height={464} borderRadius={15} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
          <div
            className={`${
              isRtl ? "pr-[10px]" : "pl-[10px]"
            } product-info-section bg-[#ffffff] flex-col align-start`}
          >
            <div className="flex-col px-[10px] max-w-full w-full">
              <div
                className={`${
                  isRtl ? "flex-row-reverse" : "flex-row"
                } product-brand-logo flex-row items-center gap-[11px]`}
              >
                {product?.brand?.icon && (
                  <img
                    width={"auto"}
                    height={18}
                    src={GetImageUrl(product.brand.icon)}
                    alt={product.brand.name}
                  />
                )}
              </div>
              <div
                className={`${
                  isRtl ? "flex-row-reverse" : "flex-row"
                } product-text-section  align-center h-auto`}
              >
                <div
                  className={`${
                    isRtl && "dir-rtl"
                  } text-[#1D1D1D] regular capitalize text-[13px]`}
                  data-cy="productName_productPage"
                >
                  {product?.name}
                </div>
              </div>
              <Skeleton width={200} height={13} borderRadius={4} />
              <Skeleton width={200} height={13} borderRadius={4} />
            </div>

            <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
              <div
                className={`product-shipping h-auto  rounded-none p-0 py-[8px]  justify-start product-colors  flex-col align-start relative`}
              >
                <Skeleton width={"100%"} height={75} borderRadius={12} />
              </div>

              {/* Skeleton commenst */}
              <div className="w-full h-[228px] flex-row gap-[8px]">
                {[1, 1, 1].map((s) => (
                  <Skeleton borderRadius={12} width={"85%"} height={"100%"} />
                ))}
              </div>
            </div>

            {/* footer */}
          </div>
        </div>
        <div className="product-details-footer alternate-product-details-footer z-[999999999] bottom-[50px]">
          <div className="product-info-container p-0 h-[40px] overflow-hidden">
            <div
              className={`flex h-[40px] w-full relative items-end pb-[8px] overflow-hidden ${
                isRtl ? "flex-row-reverse pr-[20px]" : "flex-row pl-[20px]"
              }`}
            >
              {/* 10% Client Logic: Only this component interacts with cookies */}
              <div
                className={`flex items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-[#fff] ${
                  isRtl ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* If price != offer, show both original and offer as strikethrough */}
                {product.price !== product?.offer_price && (
                  <StrikethroughPrice
                    val={RoundPrice({
                      num: product.price,
                      language: languageVariable,
                    })}
                  />
                )}
                <span className="bold text-[#1D1D1D]">
                  {RoundPrice({
                    num: product.offer_price,
                    language: languageVariable,
                  })}
                </span>
                <span>{currency?.symbol}</span>
              </div>

              {/* Static Info Icon & Marquee (Server Side) */}
              <span className="flex ml-[3px] pb-[8px]">
                <svg
                  id="Group_10807"
                  data-name="Group 10807"
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                >
                  <g
                    id="Group_10756"
                    data-name="Group 10756"
                    transform="translate(0)"
                  >
                    <path
                      id="Subtraction_1"
                      data-name="Subtraction 1"
                      d="M.24,8.833A.236.236,0,0,1,.1,8.783.266.266,0,0,1,.01,8.506L.618,6.5A4.393,4.393,0,0,1,0,4.249,4.175,4.175,0,0,1,4.086,0,4.174,4.174,0,0,1,8.171,4.249,4.175,4.175,0,0,1,4.086,8.5a3.979,3.979,0,0,1-2.292-.728L.375,8.79A.219.219,0,0,1,.24,8.833ZM4.048,6.4a.523.523,0,1,0,.515.524A.512.512,0,0,0,4.048,6.4Zm.106-4.171a.806.806,0,0,1,.874.807c0,.4-.168.641-.641.938a1.314,1.314,0,0,0-.749,1.181v.093c0,.293.157.475.409.475.234,0,.369-.149.391-.43.019-.408.166-.613.655-.913a1.544,1.544,0,0,0-.9-2.9,1.647,1.647,0,0,0-1.611.9,1.087,1.087,0,0,0-.106.474.354.354,0,0,0,.379.4c.205,0,.319-.1.394-.341A.871.871,0,0,1,4.154,2.229Z"
                      transform="translate(0 2.167)"
                      fill="#5d5c5d"
                    />
                    <path
                      id="Path_21380"
                      data-name="Path 21380"
                      d="M10.048,8.863a.237.237,0,0,1-.144.05.217.217,0,0,1-.135-.043L8.35,7.853l-.016.01A4.871,4.871,0,0,0,8.7,6a4.665,4.665,0,0,0-4.566-4.75,4.331,4.331,0,0,0-1,.117A3.966,3.966,0,0,1,6.059.079a4.175,4.175,0,0,1,4.086,4.25,4.38,4.38,0,0,1-.618,2.25l.609,2.007a.263.263,0,0,1-.087.277Z"
                      transform="translate(-0.051 0.42)"
                      fill="#5d5c5d"
                    />
                    <rect
                      id="Rectangle_4714"
                      data-name="Rectangle 4714"
                      width="10.575"
                      height="11"
                      transform="translate(0.425)"
                      fill="none"
                    />
                  </g>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductLoader;

// Reusable UI for the strikethrough effect
const StrikethroughPrice = ({ val }) => (
  <span className="relative text-[#C4C2C2]">
    <svg className="top-1/2 left-0 absolute" width="100%" height="2">
      <line
        x2="100%"
        transform="translate(0 1)"
        fill="none"
        stroke="#C4C2C2"
        strokeWidth="2"
      />
    </svg>
    {val}
  </span>
);
