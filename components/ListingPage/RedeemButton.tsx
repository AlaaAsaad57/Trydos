import React from "react";
import { translateFunction } from "utils/functions";

function RedeemButton({
  seconds,
  language,
}: {
  seconds: number;
  language: string;
}) {
  const ClockIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="11"
      height="11"
      viewBox="0 0 11 11"
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4644"
            data-name="Rectangle 4644"
            width="11"
            height="11"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_827"
        data-name="Mask Group 827"
        clipPath="url(#clip-path)"
      >
        <g id="timer-2">
          <g id="Group_14275" data-name="Group 14275">
            <path
              id="Path_23567"
              data-name="Path 23567"
              d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z"
              fill="#ff6200"
            />
            <path
              id="Path_23568"
              data-name="Path 23568"
              d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z"
              fill="#ff6200"
            />
            <path
              id="Path_23569"
              data-name="Path 23569"
              d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z"
              fill="#ff6200"
            />
          </g>
        </g>
      </g>
    </svg>
  );
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      data-cy="product-card-redeem-badge"
      className="absolute pr-[5px] pl-[8px] text-nowrap flex-row h-[19px] gap-[2px] items-center  top-[-8px] left-[0px] z-[99] rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px] bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]"
      style={{
        border: "1px solid #FF6200",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <ClockIcon />
      <span className="whitespace-nowrap bold">
        {translateFunction("Luck!")}
      </span>
      <span className="whitespace-nowrap ">
        {translateFunction("Add To Bag Within ")}
      </span>
      <span className="whitespace-nowrap bold ">{seconds}</span>
      <span className="whitespace-nowrap ">{translateFunction("seconds")}</span>
    </div>
  );
}

export default RedeemButton;
