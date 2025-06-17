import RatingStars from "components/settings/cards/RatingStars";
import React from "react";
import { translateFunction } from "utils/functions";
import CommentIcon from "public/svg/CommentIcon.svg";

function RatingOrderItem() {
  return (
    <div className="flex-col w-auto items-center justify-center z-40 absolute left-[116px] bottom-[12px]">
      <div className="flex-row items-center justify-center">
        <RatingStars />
        <span className="ligth text-[15px] text-[#8D8D8D] mx-[12px] h-[15px] border-l border-[#8D8D8D80]"></span>
        <div className="flex-row gap-[6px] items-center justify-center regular text-[10px] text-[#C4C2C2] cursor-pointer">
          <span>
            <CommentIcon />
          </span>
          <span>{translateFunction("Add Comment…")}</span>
        </div>
      </div>
      <div className="flex-row"></div>
    </div>
  );
}

export default RatingOrderItem;
