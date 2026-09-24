"use client";

import React from "react";
export type TabId = "home" | "search" | "live" | "cart" | "profile";

/**
 * Each icon draws twice: an outline for the idle state and a solid shape for
 * the active state. That swap is the core of the Instagram / iOS tab bar look.
 */
export function TabIcon({
  id,
  filled,
  size = 25,
}: {
  id: TabId;
  filled: boolean;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (id === "home") {
    const d =
      "M4 10.6 12 4.2l8 6.4V19a1.4 1.4 0 0 1-1.4 1.4h-3.9v-5.3H9.3v5.3H5.4A1.4 1.4 0 0 1 4 19z";
    return (
      <svg {...common} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.7}>
        <path d={d} />
      </svg>
    );
  }

  if (id === "search") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={filled ? 2.6 : 1.7}>
        <circle cx="11" cy="11" r="6.4" />
        <path d="M15.8 15.8 20.6 20.6" />
      </svg>
    );
  }

  if (id === "live") {
    return (
      <svg {...common} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.7}>
        <rect x="3.4" y="5.6" width="12" height="12.8" rx="3.2" />
        <path d="M15.4 10.6 19.6 8a.85.85 0 0 1 1.3.72v6.56a.85.85 0 0 1-1.3.72l-4.2-2.6z" />
      </svg>
    );
  }

  if (id === "cart") {
    return (
      <svg {...common} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.7}>
        <path d="M5.9 7.8h12.2l-1 12.2a1 1 0 0 1-1 .9H7.9a1 1 0 0 1-1-.9z" />
        <path
          d="M9.4 8.2V6.6a2.6 2.6 0 0 1 5.2 0v1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
        />
      </svg>
    );
  }

  return (
    <svg {...common} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.7}>
      <circle cx="12" cy="8.4" r="3.7" />
      <path d="M4.9 20.2c.7-3.9 3.6-6.2 7.1-6.2s6.4 2.3 7.1 6.2z" />
    </svg>
  );
}
