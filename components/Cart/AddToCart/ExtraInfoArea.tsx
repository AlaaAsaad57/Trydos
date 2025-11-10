import Timer from "components/Login/Timer";
import React from "react";
import { useAppStore } from "store";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { RoundPrice, translateFunction } from "utils/functions";
import FlashDealBannerCart from "./FlashDealBannerCart";
import PropertiesFeaturesInAddToCart from "./ProductFeatures";
import CartContentOfProduct from "./CartContentOfProduct";

function ExtraInfoArea({
  isInCart,
  isRedeem,
  isQtyEmpty,
  isValid = true,
  selected_color,
  selected_size,
  redeem_price,
  flashDeal,
  isCollectAfterOrder,
  RedemEnd = () => {},
  id,
  product,
}) {
  const configureRedeemedProducts = () => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? redeemed_products_ids
        : [];
      if (!parsed_redeemed_products_ids?.find((s) => s.id === id)) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids,
            { id: id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id: id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setCookie("redemed_ids", [
        { id: id, showingDate: new Date().toISOString() },
      ]);
    }
  };
  const hideRedeemPriceIfItsStillShown = () => {
    let bar = document.querySelector<HTMLDivElement>("#product-redeem-counter");
    if (bar) {
      bar.classList.remove("flex");
      bar.style.display = "none";
    }
  };
  const getCounters = () => {
    if (typeof window === "undefined") return 0;
    let counter = localStorage?.getItem("counter");
    let parsed_counter = JSON.parse(counter);
    if (parsed_counter?.product_id === id) {
      return parseInt(parsed_counter.counter);
    }
    return 50;
  };
  const { currency, language } = useAppStore();
  const ClockIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="11"
      height="13"
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

  const showSelectedVariation = () => {
    const isRtl = language === "ar" || language === "ku";
    if (!selected_color && !selected_size) return <></>;
    if (selected_color && selected_size) {
      return (
        <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full justify-center px-[20px]">
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex  items-center gap-[3px] regular text-[10px] text-[#1d1d1d]`}
          >
            <span>{translateFunction("Color")}</span>
            <span className="bold" data-cy="add-to-cart-selected-color">
              {selected_color?.color_name}
            </span>
            <span>|</span>
            <span>{translateFunction("Size")}</span>
            <span className="bold" data-cy="add-to-cart-selected-size">
              {selected_size?.name || selected_size}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full justify-center px-[20px]">
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex  items-center gap-[3px] regular text-[10px] text-[#1d1d1d]`}
          >
            {selected_color ? (
              <>
                <span>{translateFunction("Color")}</span>
                <span className="bold" data-cy="add-to-cart-selected-color">
                  {selected_color?.color_name}
                </span>
              </>
            ) : selected_size ? (
              <>
                <span>{translateFunction("Size")}</span>
                <span className="bold" data-cy="add-to-cart-selected-size">
                  {selected_size?.name || selected_size}
                </span>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      );
    }
  };
  // if qty is 0
  if (isQtyEmpty && !isCollectAfterOrder) {
    return (
      <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full px-[20px]">
        <div className="flex items-center justify-center rounded-[10px] bg-[#F8F8F8] text-[11px] text-[#1d1d1d] w-full h-[25px] medium">
          {translateFunction("Take A Look At Other Colors")}
        </div>
      </div>
    );
  }
  // never add to cart
  if (!isInCart) {
    // if reddem
    if (isRedeem) {
      return (
        <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full px-[20px]">
          <div className="flex items-center justify-center align-baseline rounded-[10px] bg-[#FFF3E8] text-[9px] text-[#FF6200] w-full h-[25px] relative gap-[3px]">
            <ClockIcon />
            <span className="bold">{translateFunction("Luck!")}</span>
            <span>{translateFunction("Add To Bag Within")}</span>
            <span className="bold">
              <Timer
                onlySeconds={true}
                onFinish={() => {
                  configureRedeemedProducts();
                  RedemEnd();
                  hideRedeemPriceIfItsStillShown();
                }}
                minutes={0}
                seconds={product?.seconds}
              />
            </span>
            <span className="bold">{translateFunction("Seconds")}</span>
            <span className="bold">|</span>
            <span>{translateFunction("Only")}</span>
            <span className="bold">
              {RoundPrice({
                num: redeem_price,
                rate: currency?.exchange_rate,
                language: language,
              })}
            </span>
            <span>{currency?.symbol}</span>

            <svg
              className="absolute left-0 top-0 z-10"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="25"
            >
              <rect
                x="0.25"
                y="0.25"
                width="100%"
                height="24.5"
                rx="9.75"
                stroke="#ff6200"
                stroke-width="0.5"
                fill="none"
              />
            </svg>
          </div>
        </div>
      );
    } else if (selected_color || selected_size) {
      return (
        <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full px-[20px]">
          <div className="flex items-center justify-center rounded-[10px] bg-[#F8F8F8] text-[11px] text-[#1d1d1d] w-full h-[25px]">
            {showSelectedVariation()}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full px-[20px]">
          <div className="flex items-center  rounded-[10px] bg-[#F8F8F8] text-[11px] text-[#1d1d1d] w-full h-[25px]">
            {flashDeal && <FlashDealBannerCart end_data={flashDeal} />}
            <PropertiesFeaturesInAddToCart />
          </div>
        </div>
      );
    }
  } else {
    return <CartContentOfProduct />;
  }

  return <></>;
}

export default ExtraInfoArea;
