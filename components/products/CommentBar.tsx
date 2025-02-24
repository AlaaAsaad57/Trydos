import { AddComment } from "models/Api";
import React, { useState } from "react";

import { AxiosPost } from "utils/AxiosApi";
import { Sendevent, User, UserID } from "utils/functions";
import CommentPost from "public/svg/CommentPost.svg";
function CommentBar({
  product,
  setComments,
  setRender,
  Render,
  CommentsData,
  increase_comments,
  ErrorAccure,
  verifyCommentAction,
}) {
  const addCommentAction = (s) => {
    console.log(s);
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
  const user = User();
  const addComment = async (s) => {
    let mid = Math.round(Math.random() * 1000);
    try {
      addCommentAction({
        comment: s,
        customer: { id: user.id, name: user.name },
        created_at: new Date().toISOString(),
        mid: mid,
      });
      setVal("");
      let req: AddComment = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/product_comment",
        title: "add comment For Product",
        body: {
          customer_id: UserID(),
          product_id: product?.id,
          comment: s,
        },
      });
      if (req?.comment) {
        let newComment = req.comment;
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
            Sendevent({
              event: "button_clicked",
              value: "confirm_comment_button",
            });
          }
        }}
        onInput={(e) => {
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
        placeholder="type a comment"
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
            Sendevent({
              event: "button_clicked",
              value: "confirm_comment_button",
            });
          }}
        >
          <CommentPost />
        </span>
      )}
    </div>
  );
}

export default CommentBar;
