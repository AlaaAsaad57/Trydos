import { memo } from "react";
import { useSelector } from "react-redux";

function PriceLabel({
  price_formatted,
  offer_price,
}: {
  price_formatted: number;
  offer_price: number;
}) {
  console.log(price_formatted, offer_price);
  const currency = useSelector((state: any) => state.homepage.currency);
  return (
    <div className="price-label flex">
      {offer_price >= 0 && (
        <span className="old-price relative f-12 color-dark-gray light-text">
          {price_formatted}
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
        {offer_price >= 0 && offer_price}
      </span>
      <span className="currency-label light-text color-dark-gray flex f-10">
        {currency?.symbol}
      </span>
    </div>
  );
}

export default memo(PriceLabel);
