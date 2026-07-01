import React, { useEffect, useState } from "react";
import auth from "services/auth";
import { LogError, translateFunction } from "utils/functions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

import { showErrorNotification } from "store/notifications/reducer";
import { useAppStore } from "store";
import { getFirstLetterLang } from "utils/tinyUtils";
import "styles/comment.css";
import { GetFaqItemElement } from "serverRequests/product";
import Spinner from "components/global/Spinner";
function CommentBar({ product_data, setCommentsData }) {
  let { language, setShouldUpdateComment, setShouldUpdateCommentsCount } =
    useAppStore();
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  const addComment = async () => {
    try {
      setTimeout(() => {
        document.querySelector(".comments-extended").scrollTop = 0;
      }, 300);
      let userData: any = useAppStore.getState().userProfile;
      if (userData.need_auth) {
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number"),
        );
        return null;
      }
      setLoading(true);
      const variant =
        [product_data?.color, product_data?.size]
          ?.filter((s) => Boolean(s))
          ?.join("-") ?? null;
      let res = await fetchData({
        url: `/public_comment/comments/create`,
        method: "POST",
        body: JSON.stringify({
          text: val,
          //   @ts-ignore
          product_id: String(product_data?.id),
          user_id: String(auth.UserID()),
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
          user_type: "customer",
          phone: auth?.User()?.phone,
          owner_id: String(product_data?.owner_id),
          owner_type: product_data?.owner_type,
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
      setShouldUpdateComment({ id });
      setShouldUpdateCommentsCount(true);
      setVal("");
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In addComment in CommentBar",
      });
      setLoading(false);
    }
  };
  useEffect(() => {
    setShouldUpdateComment(null);
  }, []);
  return (
    <div
      className={`${
        loading && "opacity-75 scale-[.97] transition-all duration-150"
      } comment-input-holder relative `}
    >
      <textarea
        disabled={loading}
        data-cy="CommentField"
        tabIndex={0}
        aria-label={translateFunction("Comment input")}
        className={`w-full resize-none outline-hidden p-2 rounded-sm border border-gray-300 min-h-[56px] max-h-[120px] transition-all duration-200 `}
        style={{
          textAlign: getFirstLetterLang(val),
        }}
        onKeyDown={(e) => {
          // @ts-ignore
          if ((e.key === "Enter" || e.keyCode === "13") && !e.shiftKey) {
            e.preventDefault();
            // @ts-ignore
            addComment(e.target.value);
            e.currentTarget.style.height = "auto";
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CONFIRM_COMMENT_BUTTON,
            // });
          }
        }}
        onInput={(e) => {
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
        placeholder={translateFunction("type a comment")}
        value={val?.slice(0, 200)}
        onChange={(e) => {
          setVal(e.target.value);
        }}
      />
      {val?.length > 0 && (
        <span
          className={`${
            getFirstLetterLang(val) === "left"
              ? "right-[30px]"
              : "left-[30px] rotate-180"
          } absolute h-full flex items-center top-0 ${
            loading ? "cursor-help" : "cursor-pointer"
          }`}
          data-cy="SubmitComment"
          onClick={() => {
            if (loading) return;
            // @ts-ignore
            addComment(val);
            document.querySelector("textarea").style.height = "auto";
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CONFIRM_COMMENT_BUTTON,
            // });
          }}
        >
          {!loading ? <img src="/icons/CommentPost.svg" /> : <Spinner />}
        </span>
      )}
    </div>
  );
}

export default CommentBar;
