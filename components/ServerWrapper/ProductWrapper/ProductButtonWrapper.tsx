"use client";
import { useLuckyDrawTimer } from "components/ListingPage/LuckyDrawer";
import { useState } from "react";
import { useAppStore } from "store";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { RoundPrice, translateFunction } from "utils/functions";

function ProductButtonWrapper({
  language,
  currency,
  is_redeem,
  endDate,
  id,
  is_flashDeal,
  redeem_price,
  price,
  offer_price,
  flash_deal_price,
  slug,
  seconds = null,
  InitialProductData = {},
}) {
  const [redeem_expired, setRedeemExpired] = useState(!is_redeem);
  let isRtl = language === "ar" || language === "ku";
  let isFlash = false;
  let flash_price = offer_price ?? price;
  if (is_flashDeal && endDate) {
    const now = new Date();
    const dealEnd = new Date(endDate);
    dealEnd.setHours(23, 59, 59, 999);
    isFlash = now < dealEnd;
  }
  if (isFlash) {
    flash_price = flash_deal_price ?? offer_price ?? price;
  }
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

  const TimerHook = is_redeem
    ? useLuckyDrawTimer({
        id: id,
        language: language,
        seconds: seconds ?? 50,
        onExpire: () => {
          onExpire();
        },
      })
    : null;
  const onExpire = () => {
    configureRedeemedProducts();
    setRedeemExpired(true);
    document
      .querySelector(`#product_${slug}`)
      ?.classList.remove("product_redeem");
  };
  const AddToCart = () => {
    const { setSelectedProductForCart } = useAppStore.getState();
    let is_redeem_product_card = document
      .querySelector(`#product_${slug}`)
      ?.classList.contains("product_redeem");
    console.log(
      "is_redeem-",
      is_redeem_product_card,
      is_redeem,
      !redeem_expired
    );
    setSelectedProductForCart({
      ...InitialProductData,
      shouldUpdate: 0,
      id: id,
      showRedeemPrice: is_redeem_product_card && is_redeem && !redeem_expired,
      is_from_listing: true,
      seconds:
        is_redeem_product_card && is_redeem && !redeem_expired
          ? TimerHook.secondsLeft
          : 0,
    });
  };
  return (
    <>
      <div
        style={{
          left: !isRtl ? "initial" : "0px",
          right: isRtl ? "initial" : "0px",
          direction: isRtl ? "rtl" : "ltr",
        }}
        className={`buy-button pb-[10px] px-[4px]   light-text flex-col align-start justify-end cursor-pointer absolute z-[50] bottom-0  pr-[10px] h-[40px] items-center`}
        data-cy="buy-button"
        onClick={(e) => {
          e.preventDefault();
          AddToCart();
          // onExpire();
        }}
      >
        {is_redeem && <TimerHook.MiniTimer />}

        <div className="flex flex-row items-center product_prices gap-[6px]">
          <div className="text-[10px] pt-[2px] flex align-start regular items-center gap-[2px] buy-card-text">
            <span>{translateFunction("Buy", language)}</span>
            {is_redeem && (
              <RedeemPrice
                price={RoundPrice({
                  num: redeem_price,
                  rate: currency?.exchange_rate,
                  language: language,
                  points: currency?.decimal_digits,
                })}
                symbol={currency?.symbol}
              />
            )}
          </div>
          <img
            src={"/svg/BuyButton.svg"}
            width={15}
            height={15}
            alt="buy Button"
            className={`${
              // shouldShowRedeem && seconds > 0
              true ? "" : "mx-[8px]"
            } max-h-[20px] max-w-[40px] `}
          />
        </div>
      </div>
      {is_redeem && <TimerHook.TopTimer />}
    </>
  );
}

export default ProductButtonWrapper;

const RedeemPrice = ({ price, symbol }) => {
  return (
    <div className="flex-row flex gap-[2px] items-center redeem_show">
      <span
        className="text-[10px] pt-[2px] flex align-start bold relative text-[#FF5724]"
        data-cy="product-redeem-price"
      >
        {price}
      </span>
      <span className="text-[8px] light pt-[2px] flex align-start">
        {symbol}
      </span>
    </div>
  );
};
