import axios from "axios";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { OTP_URL } from "utils/endpointConfig";

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
    setComments([, { ...s, is_verfied: false }, ...CommentsData]);
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
  const user = useSelector((state: any) => state.auth.user);
  const addComment = async (s) => {
    let mid = Math.round(Math.random() * 1000);
    try {
      setVal("");

      addCommentAction({
        comment: s,
        customer: { id: user.id, name: user.name },
        created_at: new Date().toISOString(),
        mid: mid,
      });
      let req = await axios.post(
        OTP_URL + "/customer/product_comment",
        {
          customer_id: user?.id,
          product_id: product?.id,
          comment: s,
        },
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("MARKET-TOKEN") ||
              localStorage.getItem("DEVICE-TOKEN")
            }`,
          },
        }
      );
      if (req.data?.data?.comment) {
        let newComment = req.data.data.comment;
        verifyComment(mid, newComment);
      } else {
        isError(mid);
      }
    } catch (e) {
      isError(mid);
    }
  };
  return (
    <div className="comment-input-holder">
      <textarea
        onKeyDown={(e) => {
          // @ts-ignore
          if ((e.key === "Enter" || e.keyCode === "13") && !e.shiftKey) {
            e.preventDefault();
            addComment(val);
            e.currentTarget.style.height = "auto";
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
    </div>
  );
}

export default CommentBar;
