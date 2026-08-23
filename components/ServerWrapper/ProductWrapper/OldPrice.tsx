export const OldPrice = ({ price }) => {
  return (
    <span
      className="old-price relative f-12 text-[#3c3c3c] light-text"
      data-pw="product-price"
    >
      {price}
      <svg
        className="absolute w-full top-1/2"
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
  );
};
