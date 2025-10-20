import BottomSheet from "components/global/BottomSheet";
import React, { useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import BuyersCommentIcon from "public/svg/product/BuyersCommentsIcon.svg";

import HortiznalScrollBar from "components/global/HortiznalScrollBar";

import { RateCommentItem } from "./ProductsBuyersComments";
import Skeleton from "node_modules/react-loading-skeleton/dist";

function BuyersCommentModal({ comments }) {
  const { ColorBottomSheet, setColorBottomSheet, language } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [active_comment_type, setActiveCommentType] = useState(0);
  const FilterComments = async (id) => {
    setLoading(true);
    if (active_comment_type !== id) setActiveCommentType(id);
    else setActiveCommentType(0);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
  };
  const comments_types = [
    { id: 1, name: "Size" },
    { id: 2, name: "Quality" },
    { id: 3, name: "Color" },
    { id: 4, name: "Shipping" },
    { id: 5, name: "Complaint" },
    { id: 6, name: "Recommendation" },
  ];
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_buyers_comments && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_buyers_comments}
          onClose={() => {
            setColorBottomSheet(false);
          }}
        >
          <div className="w-full h-auto pb-[80px] flex-col">
            <div className="flex-col px-[12px] gap-[6px]">
              <BuyersCommentIcon />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction("Buyers Comment", language)}
              </span>
              <p
                className={`${
                  isRtl && "dir-rtl"
                } text-[11px] text-[#1d1d1d] regular gap-[4px] inline`}
              >
                {translateFunction(
                  "All Comments Are Genuine From Customers Who Purchased And Actually Received The Product Through",
                  language
                )}
                <span className="bold px-[4px]">trydos</span>
              </p>
            </div>
            <div className="w-full px-[12px] bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>
            <div className="flex-col gap-[2px]">
              <HortiznalScrollBar
                id="product-properties-general-modal"
                className={`${
                  loading && "opacity-65"
                } flex-row  product-properties px-[12px] items-center justify-start w-full gap-[4px]`}
              >
                {comments_types.map((s) => (
                  <div
                    onClick={() => {
                      if (loading) return;
                      FilterComments(s.id);
                    }}
                    className={`pl-[8px] cursor-pointer pr-[12px] rounded-[15px] h-[31px] ${
                      active_comment_type === s.id
                        ? "bg-[#bdd3ff]"
                        : "bg-[#F8F8F8]"
                    } flex-row justify-center items-center regular text-[#505050] text-[11px] medium`}
                  >
                    {translateFunction(s.name)}
                  </div>
                ))}
              </HortiznalScrollBar>
              <div className="flex-col gap-[12px] mt-[10px]  min-h-[372px]">
                {!loading && comments?.length === 0 && (
                  <span className="w-full justify-center items-center flex py-4 light text-[#1d1d1d] ">
                    {translateFunction("There is No Comments Yet..", language)}
                  </span>
                )}
                {loading &&
                  Array(6)
                    .fill("")
                    .map((s) => (
                      <div className="w-full h-[122px]">
                        <Skeleton
                          className="w-full h-[112px] rounded-[15px]"
                          width={"100%"}
                          height={112}
                          borderRadius={15}
                        />
                      </div>
                    ))}
                {!loading &&
                  comments?.comments.map((s) => (
                    <RateCommentItem
                      comment={s}
                      language={language}
                      width={100}
                    />
                  ))}
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export default BuyersCommentModal;

const ReviewProgress = ({ value, title }) => {
  return (
    <div className="flex-row gap-[14px] min-w-[280px] w-full">
      <div className="flex-row  w-[72%] max-w-[72%] h-[14px] rounded-[5px] bg-[#FCFCFC] relative flex-1 ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="14"
          viewBox="0 0 100% 14"
          className="absolute top-0 left-0"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100%)"
            height="13.5"
            rx="2.25"
            fill="none"
            stroke="#d3d3d3"
            strokeWidth="0.5"
          />
        </svg>
        <div
          className={`h-[14px] rounded-[5px] flex bg-[#1d1d1d]`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
      <div className="flex-row items-center text-[#1d1d1d] text-[11px] regular gap-[6px] whitespace-nowrap">
        {value}%
      </div>
      <span className="bold">{title}</span>
    </div>
  );
};
