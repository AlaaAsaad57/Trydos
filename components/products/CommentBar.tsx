import { AddComment } from "models/API/market/AddComment";
import React, { useState } from "react";
import CommentPost from "public/svg/CommentPost.svg";
import auth from "services/auth";
import { translateFunction } from "utils/functions";
import { CommentBarPropsType } from "models/componentType/CommentBarPropsType";
import { fetchData } from "utils/fetchData";

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
        url: "/customer/product_comment",
        reqTitle: "add comment For Product",
        method: "POST",
        server: "market",
        body: JSON.stringify({
          customer_id: auth.UserID(),
          product_id: product?.id,
          comment: s,
        }),
      });
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
  return (
    <div className="comment-input-holder relative">
      <textarea
        data-cy="CommentField"
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
        onChange={(e) => setVal(e.target.value)}
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
