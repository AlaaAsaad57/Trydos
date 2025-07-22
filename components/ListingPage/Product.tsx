"use client";
import React, { useCallback, useEffect, useState } from "react";
import BuyButton from "./BuyButton";
import { useAppStore } from "store";
import RedeemButton from "./RedeemButton";
import { RoundPrice } from "utils/functions";
import { getCookie } from "utils/cookies/cookie-manager";
import ProductBanner from "components/products/ProductBanner";

export const BuyButtonProduct = ({
  product,
  params,
  currency,
  language,
  isForColor = false,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [shouldShowRedeem, setShouldShowRedeem] = useState(false);
  const { setSelectedProductForCart, ColorBottomSheet, setColorBottomSheet } =
    useAppStore();
  const shouldShowRedeemFunc = useCallback(() => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redemed_ids = redeemed_products_ids;
      return !parsed_redemed_ids.find((s) => s.id === product.product_id);
    }
    return true;
  }, []);
  useEffect(() => {
    if (!shouldShowRedeem) {
      setIsClient(true);
      setShouldShowRedeem(shouldShowRedeemFunc());
    }
  }, []);

  const addToCart = () => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    if (isForColor) {
      setSelectedProductForCart({
        ...product,
        activeColor: product.sync_color_images[0]?.color_option,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
        singleColor: true,
      });
    } else
      setSelectedProductForCart({
        ...product,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
      });
  };

  const RenderPrice = () => {
    if (product.is_redeem && shouldShowRedeem) {
      if (product.offer_price >= 0 && product.offer_price !== product.price) {
        return (
          <>
            <span className="old-price relative f-12 text-[#3c3c3c] light-text">
              {RoundPrice({
                num: product?.price,
                rate: currency?.exchange_rate,
                points: 0,
                language: language,
              })}
              <svg
                className="absolute w-100"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="1"
              >
                <line
                  id="Line_1"
                  data-name="Line 1"
                  x2="100%"
                  transform="translate(0 0.5)"
                  fill="none"
                  stroke="#3c3c3c"
                  strokeWidth="1"
                />
              </svg>
            </span>
            <span className="old-price ml-[3px] relative bold-text color-dark-gray flex f-12">
              {product?.offer_price >= 0
                ? RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
                  })
                : RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
                  })}
              <svg
                className="absolute w-100"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="1"
              >
                <line
                  id="Line_1"
                  data-name="Line 1"
                  x2="100%"
                  transform="translate(0 0.5)"
                  fill="none"
                  strokeLinecap="round"
                  stroke="#ff6200"
                  strokeWidth="1"
                />
              </svg>
            </span>
          </>
        );
      } else {
        return (
          <span className="old-price ml-[3px] bold-text color-dark-gray flex f-12">
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: 0,
              language: language,
            })}

            <svg
              className="absolute w-100"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="1"
            >
              <line
                id="Line_1"
                data-name="Line 1"
                x2="100%"
                transform="translate(0 0.5)"
                fill="none"
                strokeLinecap="round"
                stroke="#ff6200"
                strokeWidth="1"
              />
            </svg>
          </span>
        );
      }
    }
    if (product?.offer_price >= 0 && product.price >= 0) {
      if (product.offer_price >= 0 && product?.offer_price !== product.price) {
        return (
          <>
            <span className="old-price relative f-12 text-[#3c3c3c] light-text">
              {RoundPrice({
                num: product?.price,
                rate: currency?.exchange_rate,
                points: 0,
                language: language,
              })}
              <svg
                className="absolute w-100"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="1"
              >
                <line
                  id="Line_1"
                  data-name="Line 1"
                  x2="100%"
                  transform="translate(0 0.5)"
                  fill="none"
                  stroke="#3c3c3c"
                  strokeWidth="1"
                />
              </svg>
            </span>
            <span className="new-price bold-text color-dark-gray flex f-12">
              {product?.offer_price >= 0
                ? RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
                  })
                : RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: language,
                  })}
            </span>
          </>
        );
      } else {
        return (
          <span className="old-price relative f-12 bold-text color-dark-gray">
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: 0,
              language: language,
            })}
          </span>
        );
      }
    }
  };
  useEffect(() => {
    if (!product.flash_deal_end_date && !product?.is_redeem) return;
    if (product?.flash_deal_end_date) {
      document
        ?.querySelector(`#slug-${product.slug}`)
        ?.classList?.add("orange-border");
      return;
    }
    if (product.is_redeem && shouldShowRedeem) {
      document
        ?.querySelector(`#slug-${product.slug}`)
        ?.classList?.add("orange-border");
      return;
    }
    if (!product.flash_deal_end_date && !shouldShowRedeem) {
      document
        ?.querySelector(`#slug-${product.slug}`)
        ?.classList?.remove("orange-border");
      return;
    }
  }, [shouldShowRedeem]);
  if (!isClient)
    return (
      <>
        <div className="product-footer absolute w-100 flex-row align-center max-h-[30px]">
          <div
            className={`${
              params.lang.split("-")[1] === "ar" && "dir-rtl"
            } price-label flex`}
          >
            {RenderPrice()}
            <span className="currency-label light-text color-dark-gray flex f-10">
              {currency?.symbol}
            </span>
          </div>
        </div>
        <BuyButton
          onExpire={() => {
            setShouldShowRedeem(false);
          }}
          id={product.product_id}
          redeem_price={product.redeem_price}
          currency={currency}
          shouldShowRedeem={shouldShowRedeem && product?.is_redeem}
          buy={(e) => {
            // @ts-ignore
            addToCart();
          }}
        />
      </>
    );
  return (
    <>
      <ProductBanner
        featured={product.featured}
        flashDeals={product.flash_deal_end_date}
        labels={product.label_names}
      />
      <div className="product-footer absolute w-100 flex-row align-center max-h-[30px]">
        <div
          className={`${
            params.lang.split("-")[1] === "ar" && "dir-rtl"
          } price-label flex`}
        >
          {RenderPrice()}
          <span className="currency-label light-text color-dark-gray flex f-10">
            {currency?.symbol}
          </span>
        </div>
      </div>
      {product.is_redeem && shouldShowRedeem && (
        <>
          <RedeemButton />
        </>
      )}
      <BuyButton
        onExpire={() => {
          setShouldShowRedeem(false);
        }}
        id={product.product_id}
        redeem_price={product.redeem_price}
        currency={currency}
        shouldShowRedeem={shouldShowRedeem && product?.is_redeem}
        buy={(e) => {
          // @ts-ignore
          addToCart();
        }}
      />
    </>
  );
};
