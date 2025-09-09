import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import React from "react";
import { translateFunction } from "utils/functions";
import BestPriceIcon from "public/svg/BestPriceIcon.svg";
import BestSellIcon from "public/svg/BestSellIcon.svg";
import TrendIcon from "public/svg/TrendIcon.svg";
import FastIcon from "public/svg/FastIcon.svg";
function ProductFeatures({ language }) {
  const isRtl = language === "ar" || language === "ku";

  return (
    <HortiznalScrollBar
      id="product-features"
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } flex-row gap-[12px] items-center mt-[11px]`}
    >
      <div className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}>
        <BestPriceIcon />
        <div
          className={`${
            isRtl && "dir-rtl"
          } text-[#388CFF] text-[11px] gap-[3px] flex`}
        >
          <span className="bold">
            {translateFunction("Best Price", language)}
          </span>
          <span>{translateFunction("Last 3 Days!", language)}</span>
        </div>
      </div>

      <div className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}>
        <TrendIcon />
        <div className="text-[#FF641A] text-[11px] gap-[3px] flex">
          <span className="bold">{translateFunction("Trend", language)}</span>
          <span>{translateFunction("Color !", language)}</span>
        </div>
      </div>

      <div className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}>
        <BestSellIcon />
        <div
          className={`${
            isRtl && "dir-rtl"
          } text-[#513AAF] text-[11px] gap-[3px] flex`}
        >
          <span className="bold">
            {translateFunction("Best Sell", language)}
          </span>
          <span>{translateFunction("Last Week !", language)}</span>
        </div>
      </div>

      <div className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}>
        <FastIcon />
        <div
          className={`${
            isRtl && "dir-rtl"
          } text-[#388CFF] text-[11px] gap-[3px] flex`}
        >
          <span className="bold">
            {translateFunction("Fast Packing", language)}
          </span>
          <span>
            {translateFunction(
              "& Today Shipping If Buy Before 13:00 Today",
              language
            )}
          </span>
        </div>
      </div>
    </HortiznalScrollBar>
  );
}

export default ProductFeatures;
