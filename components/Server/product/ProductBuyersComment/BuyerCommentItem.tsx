import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/server";
import profilePng from "public/images/profileNo.png";
import Image from "next/image";
export const BuyersCommentItem = ({ comment, language, width = 90 }) => {
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${width}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
      style={{
        position: "relative",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
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
          className="comment-date text-[9px]"
          data-cy="Date-Of-Comment"
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
        >
          {formatTime(comment?.created_at, language)}
        </div>
        <div
          className={`${
            !isRtl ? "pr-[27px]" : "pl-[27px]"
          } comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-[0px]`}
        >
          {comment?.comment}
        </div>
      </div>
    </div>
  );
};
