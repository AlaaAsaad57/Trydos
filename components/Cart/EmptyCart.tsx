import { translateFunction } from "utils/functions";

function EmptyCart() {
  return (
    <div className="flex text-[#8E8E8E] text-[13px] flex-col w-full max-h-[50vh] h-[50vh] items-center justify-center gap-[7px]">
      <EmptyBagIcon />
      <div className="flex flex-row items-center medium">
        {translateFunction("Cart is Empty")}
      </div>
      <div className="flex text-[11px] regular text-center flex-row items-center max-w-[280px] mt-[2px]">
        {translateFunction(
          "See Our Many Offers And Take Advantage Of Discounts And Special Products"
        )}
      </div>
    </div>
  );
}

export default EmptyCart;

const EmptyBagIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19.545"
      height="22.858"
      viewBox="0 0 19.545 22.858"
    >
      <g
        id="Group_3178"
        data-name="Group 3178"
        transform="translate(-38.489 -37.967)"
      >
        <path
          id="Union_4"
          data-name="Union 4"
          d="M16.8,22.858H2.522A2.539,2.539,0,0,1,0,20.3l0-.027c0-.051,0-.1,0-.154a.2.2,0,0,1,0-.055L2.278,7.227l.074-.433A1.27,1.27,0,0,1,3.6,5.712H5.434V4.34a4.338,4.338,0,1,1,8.677,0V5.712h1.831a1.267,1.267,0,0,1,1.246,1.082l.045.257c.011.043.02.087.028.131l2.28,12.881c0,.017,0,.033,0,.055,0,.052,0,.1,0,.153l0,.028a2.542,2.542,0,0,1-2.52,2.559ZM13.512,5.712V4.34a3.74,3.74,0,1,0-7.48,0V5.712Z"
          transform="translate(38.489 37.967)"
          fill="#8e8e8e"
        />
        <path
          id="Path_15172"
          data-name="Path 15172"
          d="M0,2.045A8.966,8.966,0,0,1,4.965,0c2.57,0,5.315,2.045,5.315,2.045"
          transform="translate(43.121 52.253)"
          fill="none"
          stroke="#f6ebaf"
          strokeLinecap="round"
          strokeWidth="0.6"
        />
      </g>
    </svg>
  );
};
