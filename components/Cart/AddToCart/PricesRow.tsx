"use client";
import React from "react";
import { RoundPrice } from "utils/functions";
import PropertiesMarquee from "./PropertiesMarquee";
import { useAppStore } from "store";
import { getCookie } from "utils/cookies/cookie-manager";
function PricesRow({
  shipping_cost,
  offer_price,
  price,
  redeem_price,
  id,
  currency,
  language,
  noBorder = false,
  is_redeem,
}) {
  const { SelectedProduct } = useAppStore();
  const shouldShowRedeem = () => {
    const redeemed_ids = getCookie<any[]>("redemed_ids");
    return !redeemed_ids.find((s) => s.id === id);
  };
  const isRtl = language === "ar" || language === "ku";
  const renderPrice = () => {
    if (
      SelectedProduct?.is_redeem &&
      redeem_price &&
      redeem_price > 0 &&
      shouldShowRedeem()
    ) {
      if (price === offer_price) {
        return (
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex  items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-[#fff]`}
          >
            <span className="relative text-[#C4C2C2]">
              <svg
                data-cy="product_addtocart_svg"
                className="top-1/2 left-0 absolute"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="2"
              >
                <line
                  id="Line_1104"
                  data-name="Line 1104"
                  x2="100%"
                  transform="translate(0 1)"
                  fill="none"
                  stroke="#C4C2C2"
                  strokeWidth="2"
                />
              </svg>
              {RoundPrice({
                num: offer_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span className="relative bold text-[#FF6200]">
              {RoundPrice({
                num: redeem_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span>{currency?.sumbol}</span>
          </div>
        );
      } else {
        return (
          <div
            className={`flex  items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-[#fff]`}
          >
            <span className="relative text-[#C4C2C2]">
              <svg
                data-cy="product_addtocart_svg"
                className="top-1/2 left-0 absolute"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="2"
              >
                <line
                  id="Line_1104"
                  data-name="Line 1104"
                  x2="100%"
                  transform="translate(0 1)"
                  fill="none"
                  stroke="#C4C2C2"
                  strokeWidth="2"
                />
              </svg>
              {RoundPrice({
                num: price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span className="relative text-[#C4C2C2]">
              <svg
                data-cy="product_addtocart_svg"
                className="top-1/2 left-0 absolute"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="2"
              >
                <line
                  id="Line_1104"
                  data-name="Line 1104"
                  x2="100%"
                  transform="translate(0 1)"
                  fill="none"
                  stroke="#C4C2C2"
                  strokeWidth="2"
                />
              </svg>
              {RoundPrice({
                num: offer_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span className="relative bold text-[#FF6200]">
              {RoundPrice({
                num: redeem_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span>{currency?.sumbol}</span>
          </div>
        );
      }
    } else {
      if (price === offer_price) {
        return (
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex  items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-[#fff]`}
          >
            <span className="relative text-[#1D1D1D] bold">
              {RoundPrice({
                num: price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span>{currency?.sumbol}</span>
          </div>
        );
      } else {
        return (
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex  items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-[#fff]`}
          >
            <span className="relative text-[#C4C2C2]">
              <svg
                data-cy="product_addtocart_svg"
                className="top-1/2 left-0 absolute"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="2"
              >
                <line
                  id="Line_1104"
                  data-name="Line 1104"
                  x2="100%"
                  transform="translate(0 1)"
                  fill="none"
                  stroke="#C4C2C2"
                  strokeWidth="2"
                />
              </svg>
              {RoundPrice({
                num: price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span className="relative text-[#1D1D1D] bold">
              {RoundPrice({
                num: offer_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span>{currency?.sumbol}</span>
          </div>
        );
      }
    }
  };
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse  pr-[20px]" : "flex-row  pl-[20px]"
      }  flex h-[40px] w-full relative items-end pb-[8px] overflow-hidden`}
    >
      {renderPrice()}

      <span className="text-[9px] translate-x-[-1px] text-[#C4C2C2] regular">
        {currency?.symbol}
      </span>
      <span className="flex ml-[3px] pb-[8px]">
        <svg
          id="Group_10807"
          data-name="Group 10807"
          xmlns="http://www.w3.org/2000/svg"
          width="11"
          height="11"
        >
          <g id="Group_10756" data-name="Group 10756" transform="translate(0)">
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
      <PropertiesMarquee
        languageVariable={language}
        shipping_cost={shipping_cost}
      />
      {!noBorder && (
        <svg
          className="absolute bottom-0 left-0"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="0.5"
        >
          <line
            id="Line_878"
            data-name="Line 878"
            x2="100%"
            width="100%"
            transform="translate(0 0.25)"
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="0.5"
          />
        </svg>
      )}
    </div>
  );
}

export default PricesRow;
