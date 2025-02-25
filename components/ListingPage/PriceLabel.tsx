"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { GetAppLanguage, RoundPrice } from "utils/functions";

function PriceLabel({
  price_formatted,
  offer_price,
}: {
  price_formatted: number;
  offer_price: number;
}) {
  useEffect(() => {
    console.log(price_formatted, offer_price);
  }, []);
  const decimal_point_settings = useSelector(
    (state: StateInterface) => state.homepage.settings
  );
  const currency = useSelector(
    (state: StateInterface) => state.homepage.currency
  ) || { exchange_rate: 1, symbol: "" };
  const getPrice = (num) => {
    return RoundPrice({
      num: num,
      rate: currency?.exchange_rate || 1,
      points:
        (decimal_point_settings &&
          decimal_point_settings["starting-setting"]?.decimal_point_settings) ||
        0,
    });
  };
  return (
    <div
      className={`${GetAppLanguage() === "ar" && "dir-rtl"} price-label flex`}
    >
      {offer_price >= 0 && (
        <span className="old-price relative f-12 color-dark-gray light-text">
          {getPrice(price_formatted)}
          <svg
            className="absolute w-100"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="1"
          >
            <line
              id="Line_1"
              data-name="Line 1"
              x2="100%"
              transform="translate(0 0.5)"
              fill="none"
              stroke="#3c3c3c"
              strokeWidth="1"
            />
          </svg>
        </span>
      )}
      <span className="new-price bold-text color-dark-gray flex f-12">
        {offer_price >= 0 && getPrice(offer_price)}
      </span>
      <span className="currency-label light-text color-dark-gray flex f-10">
        {currency?.symbol}
      </span>
    </div>
  );
}

export default PriceLabel;
