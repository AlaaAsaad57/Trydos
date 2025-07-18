import React, { useEffect, useState, useRef, useCallback } from "react";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";

function RedeemButton({ is_redeem, redeem_price, id, product }) {
  const [show, setShouldShow] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { currency, setSelectedProductForCart } = useAppStore();
  const buttonRef = useRef(null);

  const configureRedeemedProducts = useCallback(() => {
    if (isConfigured) return;

    let redeemed_products_ids = localStorage.getItem("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? JSON.parse(redeemed_products_ids)
        : [];
      if (!parsed_redeemed_products_ids?.includes(id)) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          localStorage.setItem(
            "redemed_ids",
            JSON.stringify([...parsed_redeemed_products_ids, id])
          );
        else
          localStorage.setItem(
            "redemed_ids",
            JSON.stringify([
              ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
              id,
            ])
          );
      } else {
        return;
      }
    } else {
      localStorage.setItem("redemed_ids", JSON.stringify([id]));
    }
    setIsConfigured(true);
  }, [id, isConfigured]);

  const shouldShowRedeem = () => {
    let redeemed_products_ids = localStorage.getItem("redemed_ids");
    if (redeemed_products_ids) {
      let parsed_redemed_ids = JSON.parse(redeemed_products_ids);
      return !parsed_redemed_ids.includes(id);
    }
    return true;
  };

  useEffect(() => {
    if (shouldShowRedeem()) {
      setShouldShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show || !buttonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            configureRedeemedProducts();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      }
    );

    observer.observe(buttonRef.current);

    return () => {
      observer.disconnect();
    };
  }, [show, configureRedeemedProducts]);

  if (show)
    return (
      <div
        ref={buttonRef}
        className="absolute z-[50] top-0 left-[0px] h-[40px] text-white"
      >
        <button
          className="flex-col relative w-full h-full items-center justify-center rounded-tr-[12px] rounded-bl-[12px] px-[6px] py-[2px] bg-gradient-to-r from-[#f64f64] to-[#d73a49] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform border-0 font-medium text-[12px]"
          onClick={() => {
            // Handle redeem action
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
            setSelectedProductForCart({
              ...product,
              showRedeemPrice: true,
              shouldUpdate: 0,
            });
            configureRedeemedProducts();
            setShouldShow(false);
          }}
          aria-label={translateFunction("Redeem")}
        >
          <div className="flex-row items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              className="animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 7h-2.18A3 3 0 0015 2a3.002 3.002 0 00-2.83 2H11.83A3.002 3.002 0 009 2a3 3 0 00-2.82 5H4a1 1 0 00-1 1v3a1 1 0 001 1h1v9a1 1 0 001 1h12a1 1 0 001-1v-9h1a1 1 0 001-1V8a1 1 0 00-1-1zM15 4a1 1 0 110 2h-2a1 1 0 110-2h2zM9 4a1 1 0 110 2H7a1 1 0 110-2h2zM5 9v-1h14v1H5zm2 2h10v8H7v-8z" />
            </svg>

            <span className="font-semibold text-[12px] medium">
              {translateFunction("Redeem")}
            </span>
          </div>
          <span className="text-[12px] medium text-white">
            {currency?.symbol ? (
              RoundPrice({
                num: product.redeem_price,
                rate: currency?.exchange_rate,

                language: LocalizationServiceClass.GetAppLanguage(),
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
    );
  else return <></>;
}

export default RedeemButton;
