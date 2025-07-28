"use client";
import { useVisibilityTimer } from "hooks/useVisibilityTimer";
import { BuyButtonPropsType } from "models/componentType/BuyButtonPropsType";
import { useParams } from "next/navigation";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { RoundPrice, translateFunction } from "utils/functions";

function BuyButton({
  buy,
  shouldShowRedeem,
  redeem_price,
  currency,
  id,
  flash_deal_price,
  onExpire,
}: BuyButtonPropsType) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const showOrangeFont = () => {
    if (shouldShowRedeem) return "text-[#FF6200]";
    if (
      flash_deal_price >= 0 &&
      flash_deal_price !== undefined &&
      flash_deal_price !== null
    )
      return "text-[#FF6200]";
    else return "text-[#414141]";
  };
  return (
    <>
      <div
        className={`buy-button pb-[10px]  ${showOrangeFont()} light-text flex-col align-start justify-end cursor-pointer absolute z-[50] bottom-0 right-[0px] pr-[10px] h-[40px] items-center`}
        data-cy="buy-button"
        onClick={(e) => {
          e.preventDefault();
          buy();
          onExpire();
        }}
      >
        {shouldShowRedeem && (
          <LuckyDrawTimer
            id={id}
            onFinish={() => {
              onExpire();
            }}
          />
        )}
        <div className="flex flex-row items-center">
          <div className="text-[10px] pt-[2px] flex align-start regular items-center gap-[2px]">
            <span>
              {translate("Buy", LocalizationServiceClass.GetAppLanguage())}
            </span>
            {shouldShowRedeem ||
            (flash_deal_price >= 0 &&
              flash_deal_price !== undefined &&
              flash_deal_price !== null) ? (
              <div className="flex-row flex gap-[2px] items-center">
                <span
                  className="text-[10px] pt-[2px] flex align-start bold"
                  data-cy="product-redeem-price"
                >
                  {RoundPrice({
                    num: redeem_price || flash_deal_price,
                    rate: currency?.rate,
                    points: currency?.points,
                    language: languageVariable,
                  })}
                </span>
                <span className="text-[8px] light pt-[2px] flex align-start">
                  {currency?.symbol}
                </span>
              </div>
            ) : (
              <></>
            )}
          </div>
          <img
            src={"/svg/BuyButton.svg"}
            width={15}
            height={15}
            alt="buy Button"
            className="max-h-[20px] max-w-[40px] ml-[8px]"
          />
        </div>
      </div>
    </>
  );
}

export default BuyButton;
const LuckyDrawTimer = ({
  id,
  onFinish,
}: {
  id: string | number;
  onFinish: () => void;
}) => {
  const { isNavigating } = useAppStore();
  const ClockIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="11"
      height="11"
      viewBox="0 0 11 11"
    >
      <defs>
        <clipPath id="clipPath">
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
  let { lang } = useParams();
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
            { id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setCookie("redemed_ids", [{ id, showingDate: new Date().toISOString() }]);
    }
  };
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
    timerRef,
  } = useVisibilityTimer({
    expiryTimestamp: new Date(Date.now() + 50000),
    onExpire: () => {
      if (!isNavigating) {
        onFinish();
        configureRedeemedProducts();
      }
    },
  });
  return (
    <div className="flex flex-row items-center gap-[2px] w-full justify-end">
      <ClockIcon />
      <div className="flex flex-row text-[#ff6200]" ref={timerRef}>
        <span id={`counter-${id}`} className="bold text-[10px]">
          -{seconds}
        </span>
        <span>{translateFunction("s", languageVariable)}</span>
      </div>
    </div>
  );
};
