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
}) {
  const addCommentAction = (s) => {
    setComments([...CommentsData, { ...s, is_verfied: false }]);
    setRender(!Render);
  };
  const verifyComment = (mid, newComent) => {
    let s = CommentsData.filter((m) => m.mid === mid)[0];
    setComments([
      ...CommentsData.filter((d) => d.mid !== mid),
      { ...s, is_verfied: true },
    ]);
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
        JSON.stringify({
          customer_id: user?.id,
          product_id: product?.id,
          comment: s,
        }),
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
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
