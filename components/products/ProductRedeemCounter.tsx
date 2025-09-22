"use client";
import Spinner from "components/global/Spinner";
import Timer from "components/Login/Timer";
import React, { useEffect } from "react";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { translateFunction } from "utils/functions";

function ProductRedeemCounter({ language, product_id }) {
  const configureRedeemedProducts = () => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? redeemed_products_ids
        : [];
      if (!parsed_redeemed_products_ids?.find((s) => s.id === product_id)) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids,
            { id: product_id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id: product_id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setCookie("redemed_ids", [
        { id: product_id, showingDate: new Date().toISOString() },
      ]);
    }
  };
  const getCounters = () => {
    if (typeof window === "undefined") return 0;
    let counter = localStorage?.getItem("counter");
    let parsed_counter = JSON.parse(counter);
    if (parsed_counter?.product_id === product_id) {
      return parseInt(parsed_counter.counter);
    }
    return 50;
  };
  const finishCounter = () => {
    configureRedeemedProducts();
    let counter_elemnt = document.querySelector<HTMLDivElement>(
      "#product-redeem-counter"
    );
    let button_redeem_elemnt = document.querySelector<HTMLDivElement>(
      "#product-redeem-button"
    );
    if (counter_elemnt) {
      counter_elemnt.classList.remove("flex-row");
      counter_elemnt.style.display = "none";
    }
    if (button_redeem_elemnt) {
      button_redeem_elemnt.classList.remove("flex");
      button_redeem_elemnt.style.display = "none";
    }
    localStorage.removeItem("counter");
  };
  useEffect(() => {
    return () => {
      finishCounter();
    };
  }, []);
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
      suppressHydrationWarning={true}
      id="product-redeem-counter"
      className={`${
        isRtl
          ? " flex-row-reverse right-0 rounded-tl-[4px] rounded-tr-[15px] rounded-br-[4px] rounded-bl-[15px]"
          : "flex-row left-[0px] rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px]"
      } absolute pr-[5px] pl-[8px] text-nowrap  h-[19px] gap-[2px] items-center  top-[5px]  z-[99999999999]  bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]`}
      style={{
        border: "1px solid #FF6200",
      }}
    >
      <ClockIcon />
      <span className="whitespace-nowrap bold">
        {translateFunction("Luck!", language)}
      </span>
      <span className="whitespace-nowrap ">
        {translateFunction("Add To Bag Within ", language)}
      </span>
      <span className="whitespace-nowrap bold ">
        {getCounters() > 0 ? (
          <Timer
            seconds={getCounters()}
            minutes={0}
            onlySeconds={true}
            onFinish={() => {
              finishCounter();
            }}
          />
        ) : (
          <Spinner />
        )}
      </span>
      <span className="whitespace-nowrap ">
        {translateFunction("seconds", language)}
      </span>
    </div>
  );
}

export default ProductRedeemCounter;
