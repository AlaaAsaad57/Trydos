"use client";
// The question the add-to-cart button asks when the bag line it just added or
// raised costs a different price than the one the shopper was shown.
//
// After every add the button reads the bag again (`/cart/cart_shipping`). The
// line carries `showed_price`, the price of ONE piece the sheet showed when the
// shopper tapped. When the price the line costs now is different, the shopper
// chooses: keep the item at the new price (Continue) or take the line out of
// the bag (Remove).
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";

import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";

/** The orange the cart's price-change tooltip uses. */
const WARNING_COLOR = "#FF6200";

function PriceChangedModal({
  from,
  to,
  removing,
  onContinue,
  onRemove,
}: {
  from: number;
  to: number;
  removing: boolean;
  onContinue: () => void;
  onRemove: () => void;
}) {
  const { currency } = useAppStore();
  const params = useParams();
  const language = String(params?.lang ?? "").split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  const currencyLabel = currency?.symbol ?? (currency as any)?.sumbol ?? "";
  const format = (num: number) =>
    `${RoundPrice({
      charged: true,
      num,
      rate: currency?.exchange_rate,
      points: currency?.decimal_digits,
      language,
    })} ${currencyLabel}`.trim();
  const message = translateFunction("Price changed from {from} to {to}", language)
    .replace("{from}", format(from))
    .replace("{to}", format(to));

  // Escape keeps the item, the same as Continue.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !removing) onContinue();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onContinue, removing]);

  // Drawn on <body>, so the add-to-cart sheet's own stacking does not cover it.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-999999999999 flex items-center justify-center bg-black/40 px-[24px]"
      role="dialog"
      aria-modal="true"
      aria-label={translateFunction("Price Changed", language)}
      data-pw="price-changed-modal"
    >
      <div
        className="bg-white w-full max-w-[340px] flex-col rounded-[20px] shadow-xl overflow-hidden p-[24px] items-center"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <div className="w-[56px] h-[56px] rounded-[20px] flex items-center justify-center mb-[16px] bg-[#FFF3E8]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="5" stroke={WARNING_COLOR} strokeWidth="1" />
            <path
              d="M6 3.5V6.3M6 8.3H6.005"
              stroke={WARNING_COLOR}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h3
          className="text-[16px] medium text-[#1D1D1D] text-center"
          data-pw="price-changed-modal-title"
        >
          {translateFunction("Price Changed", language)}
        </h3>

        <p
          className="text-[13px] regular text-[#8D8D8D] text-center mt-[8px] mb-[20px]"
          data-pw="price-changed-modal-message"
        >
          {message}
        </p>

        <div className="flex-row w-full gap-[10px] justify-center min-h-[44px] items-center">
          {removing ? (
            <Spinner />
          ) : (
            <>
              <button
                type="button"
                className="flex-1 h-[44px] rounded-[14px] text-[14px] regular text-[#8D8D8D] bg-[#F8F8F8]"
                onClick={onRemove}
                data-pw="price-changed-modal-remove"
              >
                {translateFunction("Remove", language)}
              </button>
              <button
                type="button"
                className="flex-1 h-[44px] rounded-[14px] text-[14px] medium text-white bg-[#513AAF]"
                onClick={onContinue}
                data-pw="price-changed-modal-continue"
              >
                {translateFunction("Continue", language)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PriceChangedModal;
