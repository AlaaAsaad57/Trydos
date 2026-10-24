"use client";

import React from "react";
import { translateFunction } from "utils/functions";

interface CartPriceChangeTooltipProps {
  fromPrice: string;
  toPrice: string;
  language: string;
  isRtl: boolean;
  onClose?: () => void;
}

export default function CartPriceChangeTooltip({
  fromPrice,
  toPrice,
  language,
  isRtl,
  onClose,
}: CartPriceChangeTooltipProps) {
  const messageTemplate = translateFunction(
    "Price changed from {from} to {to}",
    language,
  );
  const tooltipMessage = messageTemplate
    .replace("{from}", fromPrice)
    .replace("{to}", toPrice);
  const closeLabel = translateFunction("Close", language);

  return (
    <div
      role="tooltip"
      data-pw="price-change-tooltip"
      dir={isRtl ? "rtl" : "ltr"}
      className={`price-tooltip-animated absolute bottom-full mb-[6px] ${
        isRtl ? "left-0" : "right-0"
      } z-50 w-max max-w-[240px]`}
    >
      <div className="relative flex items-center gap-[8px] rounded-[12px] bg-white px-[10px] py-[7px] text-[#1D1D1D] shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#EBEBEB]">
        {/* Warning / info circle icon */}
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#FFF3E8] text-[#FF6200]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
          >
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M6 3.5V6.3M6 8.3H6.005"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* Message */}
        <span className="regular text-[11px] leading-[15px] text-[#2B2B2B] select-none">
          {tooltipMessage}
        </span>

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={closeLabel}
            data-pw="price-change-tooltip-close"
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8D8D8D] hover:bg-[#E8E8E8] hover:text-[#1D1D1D] active:scale-95 transition-all cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
            >
              <path
                d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Arrow pointer pointing down to price */}
        <span
          className={`pointer-events-none absolute -bottom-[4px] ${
            isRtl ? "left-[16px]" : "right-[16px]"
          } h-[8px] w-[8px] rotate-45 bg-white border-r border-b border-[#EBEBEB]`}
        />
      </div>
    </div>
  );
}
