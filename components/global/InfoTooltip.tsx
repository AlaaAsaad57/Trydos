"use client";

import React, { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  message: string;
  isRtl?: boolean;
  children: React.ReactNode;
  dataPw?: string;
  className?: string;
  position?: "top" | "bottom";
}

export default function InfoTooltip({
  message,
  isRtl = false,
  children,
  dataPw,
  className = "",
  position = "top",
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const posClass =
    position === "top"
      ? `bottom-full mb-[8px] ${isRtl ? "right-[-12px]" : "left-[-12px]"}`
      : `top-full mt-[8px] ${isRtl ? "right-[-12px]" : "left-[-12px]"}`;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      data-pw={dataPw}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }
        }}
        className="cursor-pointer inline-flex items-center justify-center focus:outline-none"
      >
        {children}
      </div>

      {isOpen && (
        <div
          role="tooltip"
          dir={isRtl ? "rtl" : "ltr"}
          className={`price-tooltip-animated absolute ${posClass} z-[999999] w-max max-w-[240px]`}
        >
          <div className="relative flex items-center gap-[8px] rounded-[12px] bg-white px-[10px] py-[7px] text-[#1D1D1D] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#EBEBEB]">
            {/* Warning / info circle icon from prices row */}
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

            <span className="regular text-[11px] leading-[15px] text-[#2B2B2B] select-none text-left rtl:text-right">
              {message}
            </span>

            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              aria-label="Close"
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
          </div>
        </div>
      )}
    </div>
  );
}
