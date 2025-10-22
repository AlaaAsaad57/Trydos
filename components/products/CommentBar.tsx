import { AddComment } from "models/API/market/AddComment";
import React, { useState } from "react";
import CommentPost from "public/svg/CommentPost.svg";
import auth from "services/auth";
import { translateFunction } from "utils/functions";
import { CommentBarPropsType } from "models/componentType/CommentBarPropsType";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { useParams } from "node_modules/next/navigation";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { showErrorNotification } from "store/notifications/reducer";
function CommentBar({
  product,
  setComments,
  setRender,
  Render,
  CommentsData,
  increase_comments,
  ErrorAccure,
  verifyCommentAction,
}: CommentBarPropsType) {
  const params = useParams();

  const [country, language] = (params.lang as string).split("-");
  const addCommentAction = (s) => {
    setComments([{ ...s, is_verfied: false }, ...CommentsData]);
    setTimeout(() => {
      document.querySelector(".comments-extended").scrollTop = 0;
    }, 300);
    setRender(!Render);
  };
  const verifyComment = (mid, newComent) => {
    verifyCommentAction(mid);
    increase_comments();
    setRender(!Render);
  };
  const isError = (mid) => {
    ErrorAccure(mid);
  };
  const [val, setVal] = useState("");
  const user = auth.User();
  const addComment = async (s) => {
    let mid = Math.round(Math.random() * 1000);
    try {
      addCommentAction({
        comment: s,
        customer: { id: user.id, name: user.name, image: user.image },
        created_at: new Date().toISOString(),
        mid: mid,
      });
      setVal("");
      let response: { data: AddComment } = await fetchData({
        url: "/api/products/comments/create",
        reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
        method: "POST",
        server: "local",
        body: JSON.stringify({
          user_id: auth.UserID(),
          product_id: product?.id,
          text: s,
          user_name: auth.User()?.name,
          user_avatar: auth.User().image,
        }),
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      fetch(
        `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${language}&country=${country}`
      );
      if (response.data?.comment) {
        let newComment = response.data.comment;
        verifyComment(mid, newComment);
      } else {
        isError(mid);
      }
    } catch (e) {
      isError(mid);
    }
  };
  const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
  return (
    <div className="comment-input-holder relative">
      <textarea
        data-cy="CommentField"
        tabIndex={0}
        aria-label={translateFunction("Comment input")}
        className={`w-full resize-none outline-none p-2 rounded border border-gray-300 min-h-[40px] max-h-[120px] transition-all duration-200${" bg-white"}`}
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
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
        }}
      />
      {val?.length > 0 && (
        <span
          className="absolute h-full flex items-center right-[30px] top-0"
          data-cy="SubmitComment"
          onClick={() => {
            // @ts-ignore
            addComment(val);
            document.querySelector("textarea").style.height = "auto";
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CONFIRM_COMMENT_BUTTON,
            // });
          }}
        >
          <CommentPost />
        </span>
      )}
    </div>
  );
}

export default CommentBar;
