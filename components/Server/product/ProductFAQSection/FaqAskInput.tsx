"use client";
import Spinner from "components/global/Spinner";

import { useState } from "react";

import { useAppStore } from "store";

import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import { getFirstLetterLang } from "utils/tinyUtils";
import { useAskQuestion } from "./useAskQuestion";

export const AskInput = ({
  language,
  setCommentsData,
  color,
  size,
  owner_id,
  owner_type,
  productId,
}) => {
  const { user } = useAppStore();
  const renderBorderSvg = () => {
    return (
      <svg
        className="absolute top-0 left-0 z-20"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="40"
      >
        <rect
          x="0.25"
          y="0.25"
          width="100%"
          height="39.5"
          stroke="#513aaf"
          strokeWidth="0.5"
          rx="14.75"
          fill="none"
        />
      </svg>
    );
  };
  const isRtl = language === "ar" || language === "ku";

  const [comment, setComment] = useState("");
  const { send, loading } = useAskQuestion({
    language,
    color,
    size,
    owner_id,
    owner_type,
    productId,
    onAdded: setCommentsData,
  });
  const addComment = async () => {
    if (await send(comment)) setComment("");
  };
  return (
    <div
      className={`${
        loading && "opacity-80"
      } flex mt-[9px] w-full relative h-[40px] rounded-[15px] bg-[#FFFFFF]`}
    >
      <span
        className={`absolute top-[10px] ${
          isRtl ? "right-[10px]" : "left-[10px]"
        } z-10`}
      >
        <img src="/icons/FAQInputIcon.svg" />
      </span>

      {loading && (
        <span
          className={`absolute top-[10px] ${
            isRtl ? "left-[10px]" : "right-[10px]"
          }`}
        >
          <Spinner />
        </span>
      )}
      {!loading && comment.length > 0 && (
        <span
          data-pw="faq-ask-send"
          className={`absolute top-0 cursor-pointer z-50 flex items-center justify-center h-full w-[50px] ${
            isRtl ? "left-[5px] rotate-180" : "right-[5px]"
          }`}
          onClick={() => {
            addComment();
          }}
        >
          <img
            src="/icons/CommentPost.svg"
            className="[&>path]:fill-[#f0ecff] [&>path]:stroke-[#513aaf]"
          />
        </span>
      )}
      {renderBorderSvg()}
      <input
        data-pw="faq-ask-input"
        placeholder={translateFunction(
          "Ask Seller Your Question About This Product …",
          language,
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            if (comment.length > 0) addComment();
          }
        }}
        value={comment}
        maxLength={200}
        style={{
          textAlign: getFirstLetterLang(comment),
        }}
        onChange={(e) => {
          // Cut once, in state, so what is shown is exactly what is posted.
          setComment(e.target.value.slice(0, 200));
        }}
        onMouseDown={() => {
          if (user?.phone === "0" || !user)
            showErrorNotification(translateFunction("Please log in first"));
        }}
        readOnly={loading || user?.phone === "0" || !user}
        className={`outline-hidden w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center pl-[40px] pr-[45px] flex items-center`}
      />
    </div>
  );
};
