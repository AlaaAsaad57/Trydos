import React from "react";
import CartPurbleIcon from "public/svg/CartPurbleIcon.svg";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";
import { useSearchParams } from "node_modules/next/navigation";

function ProductCartHeader({ language }) {
  const { cart, currency, total, disableAddToCartOption, enableCart } =
    useAppStore();
  const searchParams = useSearchParams();
  const enableCartAction = (s) => {
    disableAddToCartOption();
    window.history.pushState({ isPopup: true }, "open Cart");
    enableCart(s);
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");
      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'

      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
  };
  const isRtl = language === "ar" || language === "ku";
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
        <span className="medium text-[13px] text-[#1D1D1D]">{cart.length}</span>
        <span>{translateFunction("Item", language)}</span>
        <span className="medium text-[13px] text-[#1D1D1D]">
          {RoundPrice({
            num: total,
            rate: currency?.exchange_rate,
            language: language,
          })}
        </span>
        <span>{currency?.symbol}</span>
      </p>
      <CartPurbleIcon />
    </div>
  );
}

export default ProductCartHeader;
