import React from "react";
import { translateFunction } from "utils/functions";

function ProductImageIndicator({ language }) {
  return (
    <div className="absolute top-[88px] z-[99999999999] left-[45px] flex-row gap-[2px] items-center">
      <div
        className="px-[8px] h-[20px] rounded-[8px] bg-[#1D1D1D] text-[9px] text-white medium flex items-center justify-center w-auto"
        style={{
          boxShadow: "0px 3px 3px #0000000f",
        }}
      >
        {translateFunction("Only This Piece", language)}
      </div>
      <span
        style={{
          boxShadow: "0px 3px 3px #0000000f",
        }}
        className="w-[15px] h-[15px] rounded-full bg-[#1d1d1d] border-[1px] border-white"
      />
    </div>
  );
}

export default ProductImageIndicator;
