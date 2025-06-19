import React from "react";

function FeaturedBanner() {
  const CrownIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-pulse"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 16L3 6L8.5 12L12 4L15.5 12L21 6L19 16H5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-1.5 mb-1">
        <CrownIcon />
        <span className="text-xs font-bold">FEATURED</span>
      </div>
    </div>
  );
}

export default FeaturedBanner;
