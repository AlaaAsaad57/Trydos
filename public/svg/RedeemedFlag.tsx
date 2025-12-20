import * as React from "react";

const RedeemedFlag = (props: any) => (
  <svg
    width="60"
    height="20"
    viewBox="0 0 60 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="redeemedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f64f64" stopOpacity={"1"} />
        <stop offset="100%" stopColor="#d73a49" stopOpacity={"1"} />
      </linearGradient>
    </defs>
    <path d="M0 2 L50 2 L55 10 L50 18 L0 18 Z" fill="url(#redeemedGradient)" />
    <text
      x="27.5"
      y="13"
      font-family="Arial, sans-serif"
      font-size="8"
      font-weight="bold"
      text-anchor="middle"
      fill="white"
    >
      REDEEMED
    </text>
  </svg>
);

export default RedeemedFlag;
