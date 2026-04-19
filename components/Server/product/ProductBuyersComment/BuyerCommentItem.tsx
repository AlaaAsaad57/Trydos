import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/server";
import profilePng from "public/images/profileNo.png";
import Image from "next/image";
import BuyersCommentMenu from "./BuyersCommentMenu";
import { BuyerCommentRateInfo } from "./BuyerCommentRateInfo";
export const BuyersCommentItem = ({ id, comment, language, width = 90 }) => {
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      id={`comment-${comment.id}`}
      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${width}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
      style={{
        position: "relative",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <BuyersCommentMenu
        comment={comment}
        comment_type={"review"}
        isRtl={isRtl}
        language={language}
        isOwner={comment?.isOwner}
        ownerID={comment?.ownerId}
        id={comment.id}
        ownerType={comment?.ownerType}
      />
      {/* here we will put the menu and options */}
      <div className="w-full flex-col">
        <div className="flex-row items-center">
          <div className="comment-photo">
            <Image
              src={GetImageUrl(comment?.customer?.image) ?? profilePng}
              width={20}
              height={20}
              alt={comment?.customer?.name}
            />
          </div>
          <div className="comment-content capitalize mx-[10px]">
            <div
              className="comment-source text-[#1D1D1D] text-[9px] regular"
              data-cy="Source-Of-Comment"
            >
              {convertTextToXFormat(comment?.customer?.name)}
            </div>
          </div>
        </div>
        <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
          {comment?.variant}
        </span>
        <div
          className="comment-date text-[9px] absolute text-[#1d1d1d]"
          data-cy="Date-Of-Comment"
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
        >
          {formatTime(comment?.created_at, language)}
        </div>
        <div
          id={`comment-${comment.id}-text`}
          className={`${
            !isRtl ? "pr-[27px]" : "pl-[27px]"
          } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-0`}
        >
          {comment?.comment}
        </div>
      </div>
      <BuyerCommentRateInfo
        language={language}
        comment={comment}
        rating={comment.star_rating}
        recommendation={comment?.recommendation}
        key={comment.star_rating}
      />
    </div>
  );
};
