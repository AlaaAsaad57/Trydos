"use client";
import { useCallback, useEffect, useState } from "react";
import BuyButton from "./BuyButton";
import { useAppStore } from "store";
import RedeemButton from "./RedeemButton";
import { RoundPrice } from "utils/functions";
import { getCookie } from "utils/cookies/cookie-manager";
import ProductBanner from "components/products/ProductBanner";
import { DisableScroll } from "utils/tinyUtils";

export const BuyButtonProduct = ({
  product,
  params,
  currency,
  seconds = null,
  language,
  isForColor = false,
  shouldShowRedeem = false,
  setShouldShowRedeem = (e) => {},
}) => {
  const [isClient, setIsClient] = useState(false);
  const { setSelectedProductForCart } = useAppStore();
  const shouldShowRedeemFunc = useCallback(() => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redemed_ids = redeemed_products_ids;
      return !parsed_redemed_ids.find((s) => s.id === product.product_id);
    }
    return true;
  }, []);
  const isValid = () => {
    const endDate = new Date(product.flash_deal_end_date);
    endDate.setHours(23, 59, 59, 999);
    const now = new Date();
    const difference = endDate.getTime() - now.getTime();

    if (difference <= 0) {
      return false;
    } else {
      return true;
    }
  };
  useEffect(() => {
    if (!shouldShowRedeem) {
      setIsClient(true);
      setShouldShowRedeem(shouldShowRedeemFunc());
    }
  }, []);

  const addToCart = () => {
    DisableScroll();

    if (isForColor) {
      setSelectedProductForCart({
        ...product,
        activeColor: product.sync_color_images[0]?.color_option,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
        singleColor: true,
        is_from_listing: true,
        seconds: product.is_redeem && shouldShowRedeem ? seconds : 0,
      });
    } else
      setSelectedProductForCart({
        ...product,
        shouldUpdate: 0,
        id: product.product_id || product.id,
        showRedeemPrice: product.is_redeem && shouldShowRedeem,
        is_from_listing: true,
        seconds: product.is_redeem && shouldShowRedeem ? seconds : 0,
      });
  };

  const RenderPrice = () => {
    if (
      product?.flash_deal_price >= 0 &&
      product?.flash_deal_price !== null &&
      isValid()
    ) {
      return (
        <>
          <span
            className="old-price relative f-12 text-[#3c3c3c] light-text"
            data-cy="product-price"
          >
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
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
          <span
            className="old-price ml-[3px] relative bold color-dark-gray flex f-12"
            data-cy="product-offer-price"
          >
            {RoundPrice({
              num: product?.flash_deal_price,
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
              language: language,
            })}
          </span>
        </>
      );
    }
    if (product.is_redeem && shouldShowRedeem && seconds > 0) {
      if (product.offer_price >= 0 && product.offer_price !== product.price) {
        return (
          <>
            <span
              className="old-price relative f-12 text-[#3c3c3c] light-text"
              data-cy="product-price"
            >
              {RoundPrice({
                num: product?.price,
                rate: currency?.exchange_rate,
                points: currency?.decimal_digits,
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
            <span
              className="old-price ml-[3px] relative bold color-dark-gray flex f-12"
              data-cy="product-offer-price"
            >
              {product?.offer_price >= 0
                ? RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: currency?.decimal_digits,
                    language: language,
                  })
                : RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: currency?.decimal_digits,
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
          <span
            className="old-price ml-[3px] bold color-dark-gray flex f-12 relative"
            data-cy="product-redeem-price "
          >
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
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
            <span
              className="old-price relative f-12 text-[#3c3c3c] light-text"
              data-cy="product-price"
            >
              {RoundPrice({
                num: product?.price,
                rate: currency?.exchange_rate,
                points: currency?.decimal_digits,
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
            <span
              className="new-price bold color-dark-gray flex f-12"
              data-cy="product-offer-price"
            >
              {product?.offer_price >= 0
                ? RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: currency?.decimal_digits,
                    language: language,
                  })
                : RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: currency?.decimal_digits,
                    language: language,
                  })}
            </span>
          </>
        );
      } else {
        return (
          <span
            className="old-price relative f-12 bold color-dark-gray"
            data-cy="product-price"
          >
            {RoundPrice({
              num: product?.price,
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
              language: language,
            })}
          </span>
        );
      }
    }
  };
  const isRtl = language === "ar" || language === "ku";

  if (!isClient)
    return (
      <>
        <ProductBanner
          flashDeals={product.flash_deal_end_date}
          language={language}
        />
        <div
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-100 flex-row align-center max-h-[30px]"
        >
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
        flashDeals={product.flash_deal_end_date}
        language={language}
      />
      <div
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-100 flex-row align-center max-h-[30px]"
      >
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
      {product.is_redeem && shouldShowRedeem && seconds > 0 && (
        <>
          <RedeemButton seconds={seconds} language={language} />
        </>
      )}
      <BuyButton
        onExpire={() => {
          setShouldShowRedeem(false);
        }}
        id={product.product_id}
        redeem_price={product.redeem_price}
        seconds={seconds}
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
