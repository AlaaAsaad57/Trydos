"use client";
import Spinner from "components/global/Spinner";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import { RoundPrice, translateFunction } from "utils/functions";
import { DisableScroll } from "utils/tinyUtils";
import PlusCart from "public/svg/plusCart.svg";
function ProductRedeemButton({ product }) {
  const {
    setSelectedProductForCart,
    currency,
    language: languageVariable,
  } = useAppStore();
  const [shouldShow, setShouldShow] = useState(false);
  const getPrice = () => {
    if (product?.redeem_price) return product?.redeem_price;
    if (product?.variation?.length > 0) {
      let redeem_price = product.variation.find((v) => {
        v.redeem_price;
      })?.redeem_price;
      if (redeem_price) return redeem_price;
      return product?.price;
    }
    return product?.price;
  };
  const configureRedeemedProducts = () => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");
    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? redeemed_products_ids
        : [];
      if (!parsed_redeemed_products_ids?.find((s) => s.id === product?.id)) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids,
            { id: product?.id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id: product?.id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setCookie("redemed_ids", [
        { id: product?.id, showingDate: new Date().toISOString() },
      ]);
    }
  };
  const shouldShowRedeem = () => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");
    if (redeemed_products_ids) {
      let parsed_redemed_ids = redeemed_products_ids;
      return !parsed_redemed_ids.find((s) => s.id === product?.id);
    }
    return true;
  };
  useEffect(() => {
    if (shouldShowRedeem()) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
    configureRedeemedProducts();
  }, []);
  const shouldShowNotifyButton = () => {
    let bool = false;
    if (product?.variation?.length > 0) {
      bool =
        product?.variation?.filter((s) => s.qty === 0).length ===
        product?.variation?.length;
    } else {
      bool = product.available_quantity === 0;
    }

    //restricted,status,collect_after_ordering,quantity,allVarIsEmpty
    if (product?.is_active === false || product.is_country_restricted)
      return true;
    if (product.collected_after_ordering === 1) return false;
    return bool;
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";

  // if (!shouldShow) return null;
  return (
    <>
      {!shouldShowNotifyButton() && (
        <div
          id="product-redeem-button"
          className={` flex justify-center items-center mt-3 w-[150px] h-[80px] px-[10px] absolute top-[-100px] right-[20px] z-[999999999] origin-right scale-75`}
        >
          <button
            className="flex-col relative w-full h-full items-center  justify-center gap-2 px-4 py-2 bg-[#FFF3E8] text-[#FF6200] rounded-[20px] shadow-lg hover:shadow-xl transition-all duration-300 transform  border-0 font-medium text-sm"
            onClick={() => {
              // Handle redeem action
              DisableScroll();

              setSelectedProductForCart({
                ...product,
                showRedeemPrice: true,
                shouldUpdate: 0,
              });
              setShouldShow(false);
            }}
            aria-label={translateFunction(
              "Redeem this product",
              languageVariable
            )}
          >
            <PlusCart
              className={`plus-icon-button absolute top-0 right-0 [&>g>path:nth-child(1)]:hidden [&>g>path:nth-child(2)]:fill-[#FF6200]`}
            />
            <div className="flex-row items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 7h-2.18A3 3 0 0015 2a3.002 3.002 0 00-2.83 2H11.83A3.002 3.002 0 009 2a3 3 0 00-2.82 5H4a1 1 0 00-1 1v3a1 1 0 001 1h1v9a1 1 0 001 1h12a1 1 0 001-1v-9h1a1 1 0 001-1V8a1 1 0 00-1-1zM15 4a1 1 0 110 2h-2a1 1 0 110-2h2zM9 4a1 1 0 110 2H7a1 1 0 110-2h2zM5 9v-1h14v1H5zm2 2h10v8H7v-8z"
                  fill="#FF6200"
                />
              </svg>

              <span
                className={`${
                  isRtl && "dir-rtl"
                } font-semibold text-[14px] medium`}
              >
                {translateFunction("stroke of luck", languageVariable)}
              </span>
            </div>
            <span className="text-[12px] medium">
              {currency?.symbol ? (
                RoundPrice({
                  num: getPrice(),
                  rate: currency?.exchange_rate,
                  language: languageVariable,
                })
              ) : (
                <>
                  <Spinner />
                </>
              )}
              {currency?.symbol}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

export default ProductRedeemButton;
