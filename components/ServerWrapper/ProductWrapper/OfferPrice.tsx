export const OfferPrice = ({ price, is_redeem }) => {
  return (
    <span
      className="old-price ml-[3px] relative bold color-dark-gray flex f-12 "
      data-cy="product-offer-price"
    >
      {price}
      {is_redeem && (
        <svg
          className="absolute w-100 redeem_show"
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
            strokeLinecap="round"
            stroke="#ff6200"
            strokeWidth="1"
          />
        </svg>
      )}
    </span>
  );
};
