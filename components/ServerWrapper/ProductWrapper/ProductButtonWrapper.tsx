"use client";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";

// Every element gated on `luckActive` carries `data-luck-badge={id}`.
//
// The server no longer knows whether THIS shopper has already redeemed the
// product — the product grid is rendered inside a cached scope shared by
// everybody, so `is_luck` is a fact about the product only. On the first paint
// `luckActive` is therefore true for a redeemed product too, and the badge is in
// the HTML. The inline script in the layout reads the shopper's own cookie and
// hides these three elements before that paint; hydration then removes them for
// real. See utils/luck/redeemedScript.ts.
function ProductButtonWrapper({
  language,
  currency,
  is_luck,
  luckActive = false,
  secondsLeft = 0,
  id,
  luck_price,
  slug,
  InitialProductData = {},
  sizes_filters = null,
}) {
  const isRtl = language === "ar" || language === "ku";

  const AddToCart = () => {
    const { setSelectedProductForCart } = useAppStore.getState();
    setSelectedProductForCart({
      ...InitialProductData,
      shouldUpdate: 0,
      id: id,
      showRedeemPrice: luckActive,
      is_from_listing: true,
      sizes_filters: sizes_filters?.length > 0 ? sizes_filters : undefined,
      seconds: luckActive ? secondsLeft : 0,
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
        className="buy-button pb-[10px] px-[4px] light-text flex-col align-start justify-end cursor-pointer absolute z-50 bottom-0 pr-[10px] h-[40px] items-center"
        data-pw="buy-button"
        onClick={(e) => {
          e.preventDefault();
          AddToCart();
        }}
      >
        {luckActive && (
          <div
            data-luck-badge={id}
            className="flex flex-row items-center gap-[2px] w-full justify-end"
          >
            <ClockIcon />
            <div className="flex flex-row text-[#ff6200]">
              <span id={`counter-${id}`} className="bold text-[10px]">
                -{secondsLeft}
              </span>
              <span>{translateFunction("s", language)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-row items-center product_prices gap-[6px]">
          <div
            className={`text-[10px] pt-[2px] flex align-start regular items-center gap-[2px] ${
              luckActive ? "text-[#ff6200]" : "text-[#1d1d1d]"
            }`}
          >
            <span>{translateFunction("Buy", language)}</span>
            {luckActive && (
              <RedeemPrice
                productId={id}
                price={RoundPrice({
                  num: luck_price,
                  rate: currency?.exchange_rate,
                  language: language,
                  points: currency?.decimal_digits,
                })}
                symbol={currency?.symbol}
              />
            )}
          </div>
          <img
            src={"/icons/BuyButton.svg"}
            width={15}
            height={15}
            alt="buy Button"
            className="max-h-[20px] max-w-[40px]"
          />
        </div>
      </div>

      {luckActive && (
        <div
          data-luck-badge={id}
          className="absolute pr-[5px] pl-[8px] text-nowrap flex-row h-[19px] gap-[2px] items-center top-[-8px] left-0 z-99 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px] bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px] flex"
          style={{
            border: "1px solid #FF6200",
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          <ClockIcon />
          <span className="whitespace-nowrap bold">
            {translateFunction("Luck!", language)}{" "}
          </span>
          <span className="whitespace-nowrap ">
            {translateFunction("Add To Bag Within ", language)}
          </span>
          <span className="whitespace-nowrap bold ">{secondsLeft}</span>
          <span className="whitespace-nowrap ">
            {translateFunction("seconds", language)}
          </span>
        </div>
      )}
    </>
  );
}

export default ProductButtonWrapper;

const ClockIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z"
      fill="#ff6200"
    />
    <path
      d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z"
      fill="#ff6200"
    />
    <path
      d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z"
      fill="#ff6200"
    />
  </svg>
);

const RedeemPrice = ({ price, symbol, productId }) => (
  <div data-luck-badge={productId} className="gap-[2px] items-center flex">
    <span
      className="text-[10px] pt-[2px] flex align-start bold relative text-[#FF5724]"
      data-pw="product-redeem-price"
    >
      {price}
    </span>
    <span className="text-[8px] light pt-[2px] flex align-start">{symbol}</span>
  </div>
);
