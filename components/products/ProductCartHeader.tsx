import React from "react";
import CartPurbleIcon from "public/svg/CartPurbleIcon.svg";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";

function ProductCartHeader({ language }) {
  const { localCart, currency, enableCart } = useAppStore();

  const isRtl = language === "ar" || language === "ku";
  const getPrices = () => {
    let total_price = 0;
    localCart.map((s) => {
      total_price += s.offer_price * s.quantity;
    });
    return RoundPrice({ num: total_price, rate: currency?.exchange_rate });
  };
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } items-center gap-[4px] cursor-pointer`}
      onClick={() => {
        enableCart(true);
      }}
    >
      <p className="regular text-[11px] text-[#8D8D8D] flex-row gap-[3px] items-end">
        <span className="medium text-[13px] text-[#1D1D1D]">
          {localCart.length}
        </span>
        <span>{translateFunction("Item", language)}</span>
        <span className="medium text-[13px] text-[#1D1D1D]">{getPrices()}</span>
        <span>{currency?.symbol}</span>
      </p>
      <CartPurbleIcon />
    </div>
  );
}

export default ProductCartHeader;
