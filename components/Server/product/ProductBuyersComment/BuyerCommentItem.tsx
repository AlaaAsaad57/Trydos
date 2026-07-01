"use client";
import { useEffect, useState } from "react";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/server";
import profilePng from "public/images/profileNo.png";
import Image from "next/image";
import { useAppStore } from "store";
import BuyersCommentMenu from "./BuyersCommentMenu";
import { BuyerCommentRateInfo } from "./BuyerCommentRateInfo";
export const BuyersCommentItem = ({ id, comment, language, width = 90 }) => {
  const isRtl = language === "ar" || language === "ku";
  // Read the shared entity so edits/likes/deletes done in any widget reflect
  // here; fall back to the prop before the store is seeded.
  const entity = useAppStore((s) => s.commentEntities[comment?.id]);
  const deleted = useAppStore((s) => s.deletedCommentIds[comment?.id]);
  const c = { ...comment, ...entity };
  // Own the displayed text so translate/show-original is React state, not DOM
  // mutation; re-sync when the (shared) comment text changes.
  const [displayText, setDisplayText] = useState(c?.comment);
  useEffect(() => {
    setDisplayText(c?.comment);
  }, [c?.comment]);
  if (deleted) return null;
  return (
    <div
      id={`comment-${c.id}`}
      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${width}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
      style={{
        position: "relative",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <BuyersCommentMenu
        comment={c}
        comment_type={"review"}
        isRtl={isRtl}
        language={language}
        isOwner={c?.isOwner}
        ownerID={c?.ownerId}
        id={c.id}
        ownerType={c?.ownerType}
        setDisplayText={setDisplayText}
      />
      {/* here we will put the menu and options */}
      <div className="w-full flex-col">
        <div className="flex-row items-center">
          <div className="comment-photo">
            <Image
              src={GetImageUrl(c?.customer?.image) ?? profilePng}
              width={20}
              height={20}
              alt={c?.customer?.name}
            />
          </div>
          <div className="comment-content capitalize mx-[10px]">
            <div
              className="comment-source text-[#1D1D1D] text-[9px] regular"
              data-cy="Source-Of-Comment"
            >
              {convertTextToXFormat(c?.customer?.name)}
            </div>
          </div>
        </div>
        <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
          {c?.variant}
        </span>
        <div
          className="comment-date text-[9px] absolute text-[#1d1d1d]"
          data-cy="Date-Of-Comment"
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
        >
          {formatTime(c?.created_at, language)}
        </div>
        <div
          id={`comment-${c.id}-text`}
          className={`${
            !isRtl ? "pr-[27px]" : "pl-[27px]"
          } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-0`}
        >
          {displayText}
        </div>
      </div>
      <BuyerCommentRateInfo
        language={language}
        comment={c}
        rating={c.star_rating}
        recommendation={c?.recommendation}
        key={c.star_rating}
      />
    </div>
  );
};
