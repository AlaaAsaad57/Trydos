import React, { useEffect } from "react";
import CommentItem from "./CommentItem";
import { showDate } from "components/Chat/chatsFunctions";
import Skeleton from "react-loading-skeleton";
import { AddComment } from "models/API/market/AddComment";
import auth from "services/auth";
import profilePng from "public/images/profileNo.png";
import { GetImageUrl } from "utils/tinyUtils";
import { CommentsPropsType } from "models/componentType/CommentsPropsType";
import { fetchData } from "utils/fetchData";

function Comments({
  comments,
  Render,
  resendComment,
  productId,
  ErrorAccure,
  CommentsData,
  setComments,
  increase_comments,
  setRender,
  verifyCommentAction,
}: CommentsPropsType) {
  useEffect(() => {}, [Render, comments]);
  const resendCommentApi = async (mid, s) => {
    try {
      let response: { data: AddComment } = await fetchData({
        url: "/customer/product_comment",
        reqTitle: "resend add Comment For Product",
        method: "POST",
        server: "market",
        body: {
          customer_id: auth.UserID(),
          product_id: productId,
          comment: s,
        },
      });
      if (response.data?.comment) {
        let s = CommentsData.filter((m) => m.mid === mid)[0];
        verifyCommentAction(mid);
        increase_comments();
        setRender(!Render);
      } else {
        ErrorAccure(mid);
      }
    } catch (e) {
      ErrorAccure(mid);
    }
  };

  return (
    <div className="content-extended comments-extended" data-cy="CommentArea">
      {/* <CommentItem
        date="18 feb"
        name="Yxxx Oxxx"
        text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
        photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_webp/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
      /> */}
      {CommentsData !== null ? (
        CommentsData.map((s, i) => (
          <CommentItem
            data-cy="CommentItem"
            isPending={s?.is_verfied}
            resendComment={() => {
              resendComment(s.mid);
              resendCommentApi(s.mid, s.comment);
            }}
            isError={s?.isError}
            key={i}
            date={showDate(s?.created_at)}
            name={s?.customer?.name}
            text={s?.comment}
            photo={GetImageUrl(s.customer.image) ?? profilePng}
          />
        ))
      ) : (
        <>
          <Skeleton
            width={"100%"}
            height={"100px"}
            borderRadius={20}
            className="comment-item"
          ></Skeleton>
          <Skeleton
            width={"100%"}
            height={"100px"}
            borderRadius={20}
            className="comment-item"
          ></Skeleton>
        </>
      )}
    </div>
  );
}

export default Comments;
