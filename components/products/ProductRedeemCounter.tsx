"use client";
import { useLuckTimer } from "hooks/useLuckTimer";
import { translateFunction } from "utils/functions";

function ProductRedeemCounter({ language, product_id }) {
  const { luckActive, secondsLeft } = useLuckTimer(product_id, {
    // Only rendered by the server when the product is luck-eligible.
    isLuck: true,
  });
  if (!luckActive) return null;

  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      id="product-redeem-counter"
      className={`${
        isRtl
          ? "flex-row-reverse right-0 rounded-tl-[4px] rounded-tr-[15px] rounded-br-[4px] rounded-bl-[15px]"
          : "flex-row left-0 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px]"
      } flex absolute pr-[5px] pl-[8px] text-nowrap h-[19px] gap-[2px] items-center top-[5px] z-99999999999 bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]`}
      style={{ border: "1px solid #FF6200" }}
    >
      <ClockIcon />
      <span className="whitespace-nowrap bold">
        {translateFunction("Luck!", language)}
      </span>
      <span className="whitespace-nowrap ">
        {translateFunction("Add To Bag Within ", language)}
      </span>
      <span className="whitespace-nowrap bold">{secondsLeft}</span>
      <span className="whitespace-nowrap ">
        {translateFunction("seconds", language)}
      </span>
    </div>
  );
}

export default ProductRedeemCounter;

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="11"
    height="11"
    viewBox="0 0 11 11"
  >
    <path
      d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z"
      fill="#ff6200"
    />
    <path
      d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z"
      fill="#ff6200"
    />
    <path
      d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z"
      fill="#ff6200"
    />
  </svg>
);
