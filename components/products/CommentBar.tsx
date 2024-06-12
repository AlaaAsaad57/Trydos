import axios from "axios";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { OTP_URL } from "utils/endpointConfig";

function CommentBar({ product }) {
  const [val, setVal] = useState("");
  const user = useSelector((state: any) => state.auth.user);
  const addComment = async (s) => {
    setVal("");
    let req = await axios.post(
      OTP_URL + "/customer/product_comment",
      JSON.stringify({
        customer_id: user?.id,
        product_id: product?.id,
        comment: s,
      })
    );
    let newComment = req.data.data.comment;
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
