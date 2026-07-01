"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  convertTextToXFormat,
  formatTime,
  GetImageUrl,
  translateFunction,
} from "utils/server";
import profilePng from "public/images/profileNo.png";
import { LikeButton } from "../LikeButtton";
import BuyersCommentMenu from "../ProductBuyersComment/BuyersCommentMenu";
import BuyersReplyMenu from "../ProductBuyersComment/BuyersReplyMenu";
function FaqItemComponent({
  id,
  comment,
  language,
  width = 90,
  isRtl,
  seller_name,
  isFromComments = false,
}) {
  // Own question + reply text so translate/show-original is React state, not
  // DOM mutation; re-sync when the comment prop changes (e.g. after an edit).
  const [displayText, setDisplayText] = useState(comment?.comment);
  const [displayReply, setDisplayReply] = useState(comment?.seller_reply);
  useEffect(() => {
    setDisplayText(comment?.comment);
  }, [comment?.comment]);
  useEffect(() => {
    setDisplayReply(comment?.seller_reply);
  }, [comment?.seller_reply]);
  return (
    <div
      className={`flex-col ${
        width === 100 ? "min-w-full" : "min-w-[80vw]"
      } ${"max-w-full w-full"}`}
    >
      <div
        id={`comment-${comment.id}`}
        className={`${isFromComments && "comment-item-text"} comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
        style={{
          position: "relative",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <BuyersCommentMenu
          fromComments={isFromComments}
          comment_type="faq"
          comment={comment}
          isRtl={isRtl}
          language={language}
          isOwner={comment?.isOwner}
          ownerID={comment?.ownerId}
          id={comment.id}
          ownerType={comment?.ownerType}
          setDisplayText={setDisplayText}
        />
        <div className="w-full flex-col">
          <div className="flex-row items-center">
            <div className="comment-photo">
              <Image
                src={GetImageUrl(comment?.customer?.image) ?? profilePng}
                width={20}
                height={20}
                alt={convertTextToXFormat(comment?.customer?.name)}
              />
            </div>
            <div className="comment-content capitalize mx-[10px]">
              <div
                className="comment-source text-[#1D1D1D] text-[9px] regular"
                data-cy="Source-Of-Comment"
              >
                <span className="bold pr-[4px]">Q</span>{" "}
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
            {displayText}
          </div>
        </div>
        <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
          <LikeButton
            comment_id={comment.id}
            is_liked={comment.is_liked}
            productId={comment.product_id}
            target_type={"comment"}
            total_likes={comment.total_likes}
          />
        </div>
      </div>
      {comment.has_reply ? (
        <>
          <div className="px-[10px] w-full bg-[#F8F8F8]">
            <hr className="text-[#D3D3D37f] h-px bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
          </div>
          <div
            className="comment-item flex-col rounded-t-none mt-0 rounded-b-[15px] justify-between max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]"
            style={{
              position: "relative",
              direction: isRtl ? "rtl" : "ltr",
            }}
          >
            <div className="w-full flex-col">
              <div className="flex-row items-center">
                <div className="comment-photo">
                  <Image
                    src={profilePng}
                    width={20}
                    height={20}
                    alt={convertTextToXFormat(seller_name)}
                  />
                </div>
                <div className="comment-content capitalize mx-[10px]">
                  <div
                    className="comment-source text-[#1D1D1D] text-[9px] regular"
                    data-cy="Source-Of-Comment"
                  >
                    <span className="bold pr-[4px]">A</span>
                    {convertTextToXFormat(seller_name)}
                  </div>
                </div>
              </div>
              <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
                {translateFunction("Dear", language)}{" "}
                {convertTextToXFormat(comment?.customer?.name)}
              </span>
              <div
                className="comment-date text-[9px]"
                data-cy="Date-Of-Comment"
                style={{
                  right: isRtl ? "initial" : "10px",
                  left: isRtl ? "10px" : "initial",
                }}
              >
                {formatTime(comment?.reply_created_at, language)}
              </div>
              <div
                id={`comment-${comment.id}-reply-text`}
                className="comment-text max-h-[100px] overflow-auto regular text-[#1d1d1d] text-[11px] mt-0"
              >
                {displayReply}
              </div>
            </div>
            <div className="flex-row pl-[10px] pr-[3px] gap-2 w-full items-center">
              <LikeButton
                comment_id={comment.id + `-seller_reply`}
                is_liked={comment.reply_is_liked}
                productId={comment.product_id}
                target_type={"seller_reply"}
                total_likes={comment.reply_total_likes}
              />
              <BuyersReplyMenu
                id={comment.id}
                isRtl={isRtl}
                language={language}
                sellerReply={comment?.seller_reply}
                setDisplayReply={setDisplayReply}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-[10px] w-full bg-[#F8F8F8]">
            <hr className="text-[#D3D3D37f] h-px bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
          </div>
          <div
            className="comment-item text-[#1d1d1d] regular items-start flex-col rounded-t-none mt-0 rounded-b-[15px] justify-start max-w-full w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]"
            style={{
              position: "relative",
              direction: isRtl ? "rtl" : "ltr",
            }}
          >
            <svg
              fill="#3C3C3C"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="15px"
              height="15px"
              viewBox="0 0 473.068 473.068"
              xmlSpace="preserve"
              className="w-[15px] h-[15px] mb-[5px]"
            >
              <g>
                <g id="Layer_2_31_">
                  <g>
                    <path
                      d="M355.507,181.955c8.793-6.139,29.39-20.519,29.39-55.351v-71.77h9.814c4.49,0,8.17-3.679,8.17-8.169v-38.5
                c0-4.49-3.681-8.165-8.17-8.165H78.351c-4.495,0-8.165,3.675-8.165,8.165v38.5c0,4.491,3.67,8.169,8.165,8.169h9.82v73.071
                c0,34.499,10.502,42.576,29.074,53.89l80.745,49.203v20.984c-20.346,12.23-73.465,44.242-80.434,49.107
                c-8.793,6.135-29.384,20.51-29.384,55.352v61.793h-9.82c-4.495,0-8.165,3.676-8.165,8.166v38.498c0,4.49,3.67,8.17,8.165,8.17
                h316.361c4.49,0,8.17-3.68,8.17-8.17V426.4c0-4.49-3.681-8.166-8.17-8.166h-9.814v-63.104c0-34.493-10.508-42.572-29.069-53.885
                l-80.745-49.202v-20.987C295.417,218.831,348.537,186.822,355.507,181.955z M252.726,272.859l87.802,53.5
                c6.734,4.109,10.333,6.373,12.001,9.002c1.991,3.164,2.963,9.627,2.963,19.768v63.104H117.574v-61.793
                c0-19.507,9.718-26.289,16.81-31.242c5.551-3.865,54.402-33.389,85.878-52.289c4.428-2.658,7.135-7.441,7.135-12.611v-37.563
                c0-5.123-2.671-9.883-7.053-12.55l-87.54-53.339l-0.265-0.165c-6.741-4.105-10.336-6.369-11.998-9.009
                c-1.992-3.156-2.968-9.626-2.968-19.767V54.835h237.918v71.77c0,19.5-9.718,26.288-16.814,31.235
                c-5.546,3.872-54.391,33.395-85.869,52.295c-4.427,2.658-7.134,7.442-7.134,12.601v37.563
                C245.675,265.431,248.346,270.188,252.726,272.859z"
                      fill="#1d1d1d"
                    />
                    <path
                      d="M331.065,154.234c0,0,5.291-4.619-2.801-3.299c-19.178,3.115-53.079,15.133-92.079,15.133s-57-11-82.507-11.303
                c-5.569-0.066-5.456,3.629,0.937,7.391c6.386,3.758,63.772,35.681,71.671,40.08c7.896,4.389,12.417,4.05,20.786,0
                C259.246,196.334,331.065,154.234,331.065,154.234z"
                      fill="#1d1d1d"
                    />
                    <path
                      d="M154.311,397.564c-6.748,6.209-9.978,10.713,5.536,10.713c12.656,0,139.332,0,155.442,0
                c16.099,0,9.856-5.453,2.311-12.643c-14.576-13.883-45.416-23.566-82.414-23.566
                C196.432,372.068,169.342,383.723,154.311,397.564z"
                      fill="#1d1d1d"
                    />
                  </g>
                </g>
              </g>
            </svg>
            {translateFunction("Waiting Seller Reply...", language)}
          </div>
        </>
      )}
    </div>
  );
}

export default FaqItemComponent;
