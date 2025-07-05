"use client";

import React, { useState, useEffect } from "react";

interface FlashDealBannerProps {
  end_data: string;
}

function FlashDealBanner({ end_data }: FlashDealBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(end_data);
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft(null);
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [end_data]);

  const FlashIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-pulse"
    >
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ClockIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="12,6 12,12 16,14"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-semibold">
        <FlashIcon />
        <span>FLASH DEAL</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-1.5 mb-1">
        <FlashIcon />
        <span className="text-xs font-bold">FLASH DEAL</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ClockIcon />
        <div className="flex items-center gap-1 text-xs font-mono">
          {timeLeft.days > 0 && (
            <>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">
                {timeLeft.days.toString().padStart(2, "0")}
              </span>
              <span className="text-xs">d</span>
            </>
          )}
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">
            {timeLeft.hours.toString().padStart(2, "0")}
          </span>
          <span className="text-xs">:</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-xs">:</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold animate-pulse">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FlashDealBanner;
