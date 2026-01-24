"use client";
import Spinner from "components/global/Spinner";

import { useState } from "react";
import { GetFaqItemElement } from "serverRequests/product";

import auth from "services/auth";
import { useAppStore } from "store";

import { showErrorNotification } from "store/notifications/reducer";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { fetchData } from "utils/fetchData";
import { LogError, translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import { getFirstLetterLang } from "utils/tinyUtils";

export const AskInput = ({
  language,
  setCommentsData,
  color,
  size,
  owner_id,
  owner_type,
  productId,
}) => {
  const { user, setShouldUpdateComeentsCount } = useAppStore();
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
  const [loading, setLoading] = useState(false);

  const [comment, setComment] = useState("");
  const addComment = async () => {
    try {
      let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number"),
        );
        return null;
      }
      setLoading(true);
      const variant =
        [color, size]?.filter((s) => Boolean(s))?.join("-") ?? null;
      let res = await fetchData({
        url: `/public_comment/comments/create`,
        method: "POST",
        body: JSON.stringify({
          text: comment,
          //   @ts-ignore
          product_id: String(productId),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
          owner_id: String(owner_id),
          owner_type: owner_type,
          variant,
        }),
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        server: "comments",
        noMessage: true,
      });
      let id = res.data.comment_id;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      let response = await GetFaqItemElement({
        id: id,
        language,
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      if (response.comment) {
        setCommentsData(response.comment);
      }
      setShouldUpdateComeentsCount(true);
      setComment("");
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In addComment in FaqAskInput",
      });
      setLoading(false);
    }
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
          className={`absolute top-[0px] cursor-pointer z-50 flex items-center justify-center h-full w-[50px] ${
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
        placeholder={translateFunction(
          "Ask Seller Your Question About This Product …",
          language,
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            if (comment.length > 0) addComment();
          }
        }}
        value={comment.slice(0, 200)}
        style={{
          textAlign: getFirstLetterLang(comment),
        }}
        onChange={(e) => {
          setComment(e.target.value);
        }}
        onMouseDown={() => {
          if (user?.phone === "0" || !user)
            showErrorNotification(translateFunction("Please log in first"));
        }}
        readOnly={loading || user?.phone === "0" || !user}
        className={`outline-none w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center pl-[40px] pr-[45px] flex items-center`}
      />
    </div>
  );
};
