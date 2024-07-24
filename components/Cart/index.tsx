import React from "react";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import CartIcon from "public/svg/CartIcon.svg";
import CartLabel from "public/svg/cart/cartLabel.svg";

function CartContainer({ close }) {
  const language = useSelector((state: any) => state.homepage.language);
  return (
    <div className="flex-col fixed top-0 left-0 h-[100vh] w-full bg-[#F8F8F8] min-w-[100vw] z-[9999999999] pt-1">
      <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
        <div className="flex-row  w-full min-h-10 pl-1 pr-2  relative justify-between items-center ">
          <BackIcon className="cursor-pointer z-50" onClick={() => close()} />
          <span className="text-[13px] text-[#505050] regular">
            {translate("Your Shopping Bag", language)}
          </span>
          <CartIcon />
          <CartBorderHeader />
        </div>
        <div className="flex-row mt-1 min-h-[30px] w-full items-center justify-center bg-[#F8F8F8] rounded-[10px]">
          <CartLabel />
          <div className="light ml-1 text-[13px] text-[#8D8D8D]">
            <span className="medium text-[#5D5C5D]">2</span>
            <span className="ml-[3px]">items</span>
            <span className="medium text-[#5D5C5D] ml-[3px]">1150</span>
            <span className="ml-[3px]">AED</span>
          </div>
        </div>
        <div className="flex-col overflow-auto w-full h-full"></div>
      </div>
    </div>
  );
}

export default CartContainer;
const CartBorderHeader = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="40"
      className="absolute top-0 left-0"
    >
      <g
        id="Rectangle_5281"
        data-name="Rectangle 5281"
        fill="none"
        stroke="#707070"
        stroke-width="0.5"
        stroke-dasharray="3 3"
      >
        <rect width="410" height="40" rx="8" stroke="none" />
        <rect
          x="0.25"
          y="0.25"
          width="100%"
          height="39.5"
          rx="7.75"
          fill="none"
        />
      </g>
    </svg>
  );
};
