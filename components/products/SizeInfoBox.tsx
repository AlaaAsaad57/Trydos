import React from "react";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import SizeHelp from "public/svg/product/SizeHelp.svg";
function SizeInfoBox() {
  return (
    <div className="size-box flex-col">
      <div className="size-recomend flex-row align-center justify-center w-100">
        <ColorsInfo />
        <div className="recomend-text flex-row align-center">
          <span className="recomended-size">L</span> Recommended{" "}
          <span className="recomended-size">Size</span> For You{" "}
          <span className="quantity-size">Last 2</span>
        </div>
      </div>
      <div className="size-help flex-row align-center justify-center w-100 relative">
        <svg
          className="absolute"
          xmlns="http://www.w3.org/2000/svg"
          width="calc(100%)"
          height="30"
        >
          <g
            id="Rectangle_5140"
            data-name="Rectangle 5140"
            fill="none"
            stroke="#707070"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="0.5"
            stroke-dasharray="3 3"
          >
            <rect width="390" height="30" rx="10" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="calc(100%)"
              height="29.5"
              rx="9.75"
              fill="none"
            />
          </g>
        </svg>
        <SizeHelp />
        <div className="recomend-text">Need Help Finding Your Size?</div>
      </div>
    </div>
  );
}

export default SizeInfoBox;
