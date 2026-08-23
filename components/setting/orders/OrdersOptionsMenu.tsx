"use client";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";

// The order-list "three dots" sheet. Mirrors OrderOptionsMenu's look (scrim +
// bottom sheet with a grabber and an action row) but carries a single action:
// open the Hidden-Orders view. Kept deliberately minimal — one row.
function OrdersOptionsMenu({
  isRtl,
  language,
  close,
  onOpenHidden,
}: {
  isRtl: boolean;
  language: string;
  close: () => void;
  onOpenHidden: () => void;
}) {
  return createPortal(
    <>
      <div
        className="absolute top-0 left-0 min-w-screen z-999999998 min-h-screen opacity-40 bg-[black]"
        onClick={close}
      />
      <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-999999999 pb-[27px] absolute bottom-0 left-0 rounded-t-[30px] bg-white">
        <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
        <div className="flex-col items-center w-full justify-center flex-1">
          <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
            {translateFunction("Action About Your Orders", language)}
          </span>
          <div
            className="w-full h-px mt-[12px]"
            style={{ borderTop: "1px solid #C4C2C280" }}
          />
          <div
            data-pw="open-hidden-orders"
            onClick={onOpenHidden}
            className={`cursor-pointer mt-[10px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
              isRtl ? "flex-row-reverse" : " "
            }`}
          >
            <div className="relative flex w-[30px] h-[30px] items-center justify-center">
              <img className="w-[22px] h-[22px]" src="/icons/EyeIcon.svg" />
            </div>
            <div className={`flex-col ${isRtl ? "mr-[15px]" : "ml-[15px]"}`}>
              <span
                className={`regular text-[14px] text-[#1D1D1D] medium ${
                  isRtl ? "text-right" : " "
                }`}
              >
                {translateFunction("Hidden Orders", language)}
              </span>
              <p
                className={`regular text-[12px] text-[#8D8D8D] ${
                  isRtl ? "text-right" : " "
                }`}
              >
                {translateFunction("See orders and products you hid", language)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default OrdersOptionsMenu;
