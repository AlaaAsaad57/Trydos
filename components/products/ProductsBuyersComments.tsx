"use client";
import React, { useState } from "react";
import BuyersCommentIcon from "public/svg/product/BuyersCommentsIcon.svg";
import { translateFunction } from "utils/functions";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import profilePng from "public/images/profileNo.png";
import RatingStars from "components/settings/cards/RatingStars";
import RecomendedIcon from "public/svg/RecomendedIcon.svg";
import NegRecomendedIcon from "public/svg/NegRecomendIcon.svg";
import { useAppStore } from "store";
import BuyersCommentModal from "./BuyersCommentModal";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import Spinner from "components/global/Spinner";
function ProductsBuyersComments({ lang, comments, product_id }) {
  const [country, language] = lang.split("-");
  const { ColorBottomSheet, setColorBottomSheet } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const [commentsData, setCommentsData] = useState(comments.comments ?? []);
  const [offset, setOffset] = useState(comments.offset);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    try {
      setLoading(true);
      let data = await fetchData({
        url: `/api/products/comments/buyers_comments?product_id=${product_id}&offset=${JSON.stringify(
          offset
        )}`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });
      setCommentsData([...commentsData, ...data?.buyers_comments]);
      setOffset(data?.data?.offset);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_buyers_comments && (
        <BuyersCommentModal comments={comments} />
      )}
      <div className={` w-full flex-col`}>
        <div
          className={`${isRtl && "items-end"} flex-col px-[10px]`}
          onClick={() => {
            setColorBottomSheet({
              is_buyers_comments: true,
            });
          }}
        >
          <BuyersCommentIcon />
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex-row gap-[11px] items-baseline text-[#1d1d1d] regular text-[11px]`}
          >
            <span>{translateFunction("Buyers Comment", language)}</span>
            <svg
              id="Group_14553"
              data-name="Group 14553"
              xmlns="http://www.w3.org/2000/svg"
              width="9.996"
              height="9.996"
              viewBox="0 0 9.996 9.996"
            >
              <path
                id="Subtraction_1"
                data-name="Subtraction 1"
                d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
                transform="translate(0 1.969)"
                fill="#c4c2c2"
              />
              <path
                id="Path_21380"
                data-name="Path 21380"
                d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
                transform="translate(-0.332 0.375)"
                fill="#c4c2c2"
              />
              <rect
                id="Rectangle_4714"
                data-name="Rectangle 4714"
                width="9.61"
                height="9.996"
                transform="translate(0.386)"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <HortiznalScrollBar
          id="comments-buyers-bar"
          className="flex-row w-full gap-[4px]"
        >
          {commentsData?.map((s, i) => {
            return <RateCommentItem language={language} comment={s} key={i} />;
          })}
          {comments.total > commentsData?.length && (
            <div
              className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[100px] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
              style={{
                position: "relative",
              }}
              onClick={() => {
                if (!loading) loadMore();
              }}
            >
              <div className="w-full flex-col h-full justify-center items-center text-[#1d1d1d] light">
                {loading ? <Spinner /> : translateFunction("Load More")}
              </div>
            </div>
          )}
        </HortiznalScrollBar>
        <BuyersRatingBar language={language} />
      </div>
    </>
  );
}

export default ProductsBuyersComments;

export const RateCommentItem = ({ comment, language, width = 90 }) => {
  return (
    <div
      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${width}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
      style={{
        position: "relative",
      }}
    >
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
          <div className="comment-content capitalize">
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
        <div className="comment-date text-[9px]" data-cy="Date-Of-Comment">
          {formatTime(comment?.created_at)}
        </div>
        <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
          {comment?.comment}
        </div>
      </div>
      <BuyerCommentRateInfo language={language} rating={comment.star_rating} />
    </div>
  );
};

const BuyerCommentRateInfo = ({ language, rating }) => {
  return (
    <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
      <div className="flex-row  gap-[4px] text-[#1d1d1d] text-[9px] regular">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="11"
          height="11"
          viewBox="0 0 11 11"
        >
          <g
            id="Mask_Group_285"
            data-name="Mask Group 285"
            transform="translate(0 -0.251)"
            clipPath="url(#clip-path)"
          >
            <g id="Love" transform="translate(0 0.718)">
              <path
                id="Path_21279"
                data-name="Path 21279"
                d="M11.68,4.522a3.179,3.179,0,0,0-2.489-2A2.975,2.975,0,0,0,6.453,3.7,2.974,2.974,0,0,0,3.712,2.528,3.175,3.175,0,0,0,1.227,4.522a3.209,3.209,0,0,0,.741,3.456l4.359,4.273a.182.182,0,0,0,.254,0l4.359-4.273a3.209,3.209,0,0,0,.741-3.456Zm-1,3.2L6.453,11.868,2.222,7.719a2.846,2.846,0,0,1-.657-3.066,2.807,2.807,0,0,1,2.2-1.766,2.5,2.5,0,0,1,.334-.023A2.756,2.756,0,0,1,6.308,4.106a.188.188,0,0,0,.292,0A2.687,2.687,0,0,1,9.143,2.885a2.812,2.812,0,0,1,2.2,1.768,2.846,2.846,0,0,1-.657,3.066Z"
                transform="translate(-1.007 -2.499)"
                fill="#1d1d1d"
              />
            </g>
          </g>
        </svg>

        <span>110k</span>
      </div>
      <div className="flex-row gap-[4px] text-[9px] text-[#1d1d1d]">
        <RatingStars color="#1d1d1d" initialRating={rating} readOnly={true} />
        <div className="flex-row gap-[6px]">
          <span>{translateFunction("Good Quality", language)}</span>
          <span>{translateFunction("True Size", language)}</span>
        </div>
        <div className="flex-row gap-[4px] text-[#1d1d1d] text-[9px]">
          <RecomendedIcon />
          <span>{translateFunction("Recommend It", language)}</span>
        </div>
      </div>
    </div>
  );
};

const BuyersRatingBar = ({ language }) => {
  let recomended = 123;
  let not_recomended = 15;
  let recomendedPRC = (
    (100 * recomended) /
    (recomended + not_recomended)
  ).toFixed(0);
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="flex-col w-full mt-[11px] pl-[10px] pr-[10px]">
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  items-center w-full justify-between`}
      >
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          }  regular items-center text-[#1d1d1d] text-[9px] gap-[4px]`}
        >
          <RecomendedIcon />
          <span className="bold ">{recomended}</span>
          <span>{translateFunction("Buyer", language)}</span>
          <span className="bold">
            {translateFunction("Recommend It", language)}
          </span>
        </div>
        <div className="flex-row items-center regular text-[#1d1d1d] text-[9px] gap-[4px]">
          <NegRecomendedIcon />
          <span className="bold ">{not_recomended}</span>
          <span>{translateFunction("Buyer", language)}</span>
          <span className="bold">
            {translateFunction("Dont Recommend It", language)}
          </span>
        </div>
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } rounded-[5px] w-full h-[4px] bg-[#FF6200] mt-[8px]`}
      >
        <div
          className={`bg-[#068D06] rounded-[5px] h-[4px]`}
          style={{
            width: `${recomendedPRC}%`,
          }}
        />
      </div>
    </div>
  );
};
