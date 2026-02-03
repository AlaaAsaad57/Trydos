"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "utils/cookies/cookie-manager";

export default function PricesRowClientLogic({
  id,
  is_redeem_active,
  isRtl,
  currencySymbol,
  prices,
}) {
  const [hasBeenRedeemed, setHasBeenRedeemed] = useState(false);

  useEffect(() => {
    if (!is_redeem_active) return;

    const checkCookie = () => {
      const redeemed_ids = getCookie<any>("redemed_ids") || [];
      const found = redeemed_ids.some((s) => s.id === id);
      if (found !== hasBeenRedeemed) {
        setHasBeenRedeemed(found);
      }
    };

    checkCookie(); // Initial check
    const interval = setInterval(checkCookie, 1000); // Check every second
    return () => clearInterval(interval);
  }, [id, is_redeem_active, hasBeenRedeemed]);

  const showRedeemUI = is_redeem_active && !hasBeenRedeemed;

  if (showRedeemUI) {
    return (
      <div
        className={`flex items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-white ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* If price != offer, show both original and offer as strikethrough */}
        {prices.isDiscounted && <StrikethroughPrice val={prices.original} />}
        <StrikethroughPrice val={prices.offer} color="#1d1d1d" />
        <span className="bold text-[#FF6200]">{prices.redeem}</span>
        <span>{currencySymbol}</span>
      </div>
    );
  }

  // Fallback to Standard Price UI
  return (
    <div
      className={`flex items-center gap-[4px] regular text-[16px] text-[#1d1d1d] bg-white ${
        isRtl ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {prices.isDiscounted && <StrikethroughPrice val={prices.original} />}
      <span className="bold text-[#1D1D1D]">{prices.offer}</span>
      <span>{currencySymbol}</span>
    </div>
  );
}

// Reusable UI for the strikethrough effect
const StrikethroughPrice = ({ val, color = "#C4C2C2" }) => (
  <span className={`relative text-[${color}]`}>
    <svg className="top-1/2 left-0 absolute" width="100%" height="2">
      <line
        x2="100%"
        transform="translate(0 1)"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
    {val}
  </span>
);
