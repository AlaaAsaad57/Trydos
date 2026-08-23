export const OfferPrice = ({ price, luckActive }) => {
  return (
    <span
      className="old-price ml-[3px] relative bold color-dark-gray flex f-12 "
      data-pw="product-offer-price"
    >
      {price}
      {luckActive && (
        <svg
          className="absolute w-full top-1/2"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="1"
        >
          <line
            x2="100%"
            transform="translate(0 0.5)"
            fill="none"
            strokeLinecap="round"
            stroke="#ff6200"
            strokeWidth="1"
          />
        </svg>
      )}
    </span>
  );
};
