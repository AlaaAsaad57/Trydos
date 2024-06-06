import { memo } from "react";

function PriceLabel({
  price_formatted,
  offer_price,
}: {
  price_formatted: string;
  offer_price: number;
}) {
  return (
    <div className="price-label flex">
      {offer_price > 0 && (
        <span className="old-price relative f-12 color-dark-gray light-text">
          {price_formatted?.split(" ")[0]}
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
        {offer_price > 0 ? offer_price : price_formatted?.split(" ")[0]}
      </span>
      <span className="currency-label light-text color-dark-gray flex f-10">
        {price_formatted?.split(" ")[1]}
      </span>
    </div>
  );
}

export default memo(PriceLabel);
