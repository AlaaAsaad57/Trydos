"use client";
import { useParams } from "next/navigation";
import React from "react";
import Skeleton from "react-loading-skeleton";
import { translateFunction } from "utils/functions";

function ProductInfo({
  oldPrice,
  newPrice,
  currency,
}: {
  oldPrice: number;
  newPrice: number;
  currency: string;
}) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div className="product-info-container">
      <div className="product-info-price">
        <div className="product-old-price">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="2">
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
          {oldPrice ?? <Skeleton width={30} height={10} />}
        </div>
        <div className="product-new-price">
          {newPrice ?? <Skeleton width={30} height={10} />}
        </div>
        <div className="product-currency">
          {currency ?? (
            <Skeleton
              containerClassName="flex items-center"
              className="flex items-center"
              width={20}
              height={10}
            />
          )}
        </div>
        <div className="info-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
          >
            <g
              id="Group_10807"
              data-name="Group 10807"
              transform="translate(-65 -464)"
            >
              <g
                id="Group_10756"
                data-name="Group 10756"
                transform="translate(65 464)"
              >
                <path
                  id="Subtraction_1"
                  data-name="Subtraction 1"
                  d="M.262,9.636a.258.258,0,0,1-.156-.054.29.29,0,0,1-.1-.3L.675,7.091A4.792,4.792,0,0,1,0,4.636,4.554,4.554,0,0,1,4.458,0,4.554,4.554,0,0,1,8.914,4.636,4.555,4.555,0,0,1,4.458,9.273a4.341,4.341,0,0,1-2.5-.794L.409,9.589A.238.238,0,0,1,.262,9.636ZM4.416,6.982a.571.571,0,1,0,.562.571A.558.558,0,0,0,4.416,6.982Zm.115-4.55a.879.879,0,0,1,.954.88c0,.432-.183.7-.7,1.023a1.433,1.433,0,0,0-.817,1.288v.1c0,.319.171.518.447.518.255,0,.4-.162.426-.469.021-.445.181-.669.714-1a1.684,1.684,0,0,0-.987-3.16A1.8,1.8,0,0,0,2.812,2.6a1.186,1.186,0,0,0-.115.518.386.386,0,0,0,.413.434c.224,0,.349-.108.43-.372A.951.951,0,0,1,4.531,2.432Z"
                  transform="translate(0 2.364)"
                  fill="#8e8e8e"
                />
                <path
                  id="Path_21380"
                  data-name="Path 21380"
                  d="M10.677,9.661a.259.259,0,0,1-.157.055.237.237,0,0,1-.147-.047L8.824,8.559l-.017.011a5.314,5.314,0,0,0,.4-2.036A5.089,5.089,0,0,0,4.227,1.352a4.724,4.724,0,0,0-1.094.127A4.326,4.326,0,0,1,6.325.079a4.555,4.555,0,0,1,4.457,4.636,4.778,4.778,0,0,1-.675,2.455l.664,2.189a.287.287,0,0,1-.094.3Z"
                  transform="translate(0.23 0.466)"
                  fill="#8e8e8e"
                />
                <rect
                  id="Rectangle_4714"
                  data-name="Rectangle 4714"
                  width="11.536"
                  height="12"
                  transform="translate(0.464)"
                  fill="none"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div className="product-info-properties">
        <div className="product-prop-item">
          {translate("All Inclusive Without Additions")}
        </div>
        <div className="product-prop-item">
          <img width={15} height={15} alt="truck" src="/svg/greentruck.svg" />
          <span>{translate("Free Shipping")}</span>
        </div>
        <div className="product-prop-item">
          <img width={15} height={15} alt="truck" src="/svg/redtruck.svg" />
          <span>{translate("Free Return")}</span>
        </div>
        <div className="product-prop-item">
          <img
            width={10}
            height={15}
            alt="deliveryman"
            src="/svg/deliveryman.svg"
          />
          <span>{translate("Ship To You Accepted ")} 2 June</span>
        </div>
      </div>
    </div>
  );
}

export default ProductInfo;
