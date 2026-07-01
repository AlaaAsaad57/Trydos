"use client";
import Spinner from "components/global/Spinner";

import { useState } from "react";

import auth from "services/auth";
import { useAppStore } from "store";

import { showErrorNotification } from "store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { CREATE_COMMENT_URL } from "utils/endpointConfig";
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
  const { user, setShouldUpdateCommentsCount } = useAppStore();
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
      let userData: any = useAppStore.getState().userProfile;
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
        url: CREATE_COMMENT_URL,
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
      if (!res?.success || !res?.data?.comment_id) {
        throw new Error(res?.message || "Failed to create comment");
      }
      // Prepend the new question as data (no ES-indexing setTimeout, no JSX
      // action): the fields not returned by the create call are known locally.
      const newComment = {
        id: res.data.comment_id,
        customer: {
          id: auth.UserID(),
          name: auth.User()?.name,
          image: auth.User()?.image,
        },
        product_id: String(productId),
        comment,
        variant,
        ownerId: owner_id,
        ownerType: owner_type,
        created_at: new Date().toISOString(),
        has_reply: false,
        good_quality_comment: false,
        seller_reply: null,
        seller_name: null,
        reply_created_at: null,
        total_likes: 0,
        is_liked: false,
        reply_total_likes: 0,
        reply_is_liked: false,
        isOwner: true,
      };
      setCommentsData(newComment);
      setShouldUpdateCommentsCount(true);
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
        className={`outline-hidden w-full bg-transparent z-40 rounded-[15px] text-[#1d1d1d] placeholder:text-[#C4C2C2] placeholder:text-center pl-[40px] pr-[45px] flex items-center`}
      />
    </div>
  );
};
