"use client";

import React, { useState, useEffect, useRef } from "react";
import { translateFunction } from "utils/functions";

interface FlashDealBannerProps {
  end_data: string;
  top?: string;
  language: string;
  initial?: any;
}

function FlashDealBanner({
  end_data,
  top = "top-[-8px]",
  language,
  initial = null,
}: FlashDealBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(initial);
  const [isExpired, setIsExpired] = useState(false);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(end_data);
      endDate.setHours(23, 59, 59, 999);
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

    // Initial calculation happens regardless of visibility so the countdown
    // is correct as soon as the banner enters the viewport.
    calculateTimeLeft();

    let timer: ReturnType<typeof setInterval> | null = null;
    let isInView = false;

    const startTimer = () => {
      if (timer) return;
      calculateTimeLeft();
      timer = setInterval(calculateTimeLeft, 1000);
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    // Mirrors the visibility gate in components/ListingPage/LuckyDrawer.tsx:
    // only tick the interval while the card is on screen and the tab is active.
    const syncTimerToVisibility = () => {
      if (isInView && !document.hidden) {
        startTimer();
      } else {
        stopTimer();
      }
    };

    const node = bannerRef.current;
    let observer: IntersectionObserver | null = null;
    if (node) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInView = entry.isIntersecting;
          });
          syncTimerToVisibility();
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
    }

    document.addEventListener("visibilitychange", syncTimerToVisibility);

    return () => {
      stopTimer();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncTimerToVisibility);
    };
  }, [end_data]);

  const FlashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="11"
      height="11"
      viewBox="0 0 11 11"
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4644"
            data-name="Rectangle 4644"
            width="11"
            height="11"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_825"
        data-name="Mask Group 825"
        clipPath="url(#clip-path)"
      >
        <path
          id="flash"
          d="M7.188,4.125H4.342L4.79.512c0-.009,0-.045,0-.054A.464.464,0,0,0,4.313,0a.492.492,0,0,0-.391.194L.1,5.683a.448.448,0,0,0-.1.275.464.464,0,0,0,.479.458H2.848L2.4,10.494c0,.008,0,.039,0,.047A.464.464,0,0,0,2.875,11a.491.491,0,0,0,.389-.191L7.571,4.858a.448.448,0,0,0,.1-.275A.464.464,0,0,0,7.188,4.125Zm0,0"
          transform="translate(1.666)"
          fill="#ff6200"
        />
      </g>
    </svg>
  );

  if (isExpired) {
    return <></>;
  }

  return (
    <div
      ref={bannerRef}
      data-cy="flash-deal-banner"
      className={`absolute pr-[5px] pl-[8px] text-nowrap flex-row h-[19px] gap-[2px] items-center  ${top} left-0 z-99 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px] bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]`}
      style={{
        border: "1px solid #FF6200",
      }}
    >
      <FlashIcon />
      <span className="whitespace-nowrap bold">
        {translateFunction("Flash Deal", language)}
      </span>
      {timeLeft?.days >= 0 && (
        <span className="whitespace-nowrap ">
          | {timeLeft?.days?.toString()?.padStart(2, "0")} d |
        </span>
      )}
      {(timeLeft?.hours >= 0 ||
        timeLeft?.minutes >= 0 ||
        timeLeft?.seconds >= 0) && (
        <span className="whitespace-nowrap" data-cy="flash-deal-banner-time">
          {timeLeft?.hours?.toString().padStart(2, "0")}:
          {timeLeft?.minutes?.toString().padStart(2, "0")}:
          {timeLeft?.seconds?.toString().padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

export default FlashDealBanner;
