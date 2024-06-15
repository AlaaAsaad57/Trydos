import React, { useEffect } from "react";
import CommentItem from "./CommentItem";
import { showDate } from "components/Chat/chatsFunctions";
import Skeleton from "react-loading-skeleton";
import axios from "axios";
import { OTP_URL } from "utils/endpointConfig";
import { useSelector } from "react-redux";

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
}) {
  const user = useSelector((state: any) => state.auth.user);
  useEffect(() => {
    console.log(comments);
  }, [Render]);
  const resendCommentApi = async (mid, s) => {
    try {
      let req = await axios.post(
        OTP_URL + "/customer/product_comment",
        JSON.stringify({
          customer_id: user?.id,
          product_id: productId,
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
        let s = CommentsData.filter((m) => m.mid === mid)[0];
        setComments([
          ...CommentsData.filter((d) => d.mid !== mid),
          { ...s, is_verfied: true },
        ]);
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
    <div className="content-extended comments-extended">
      {/* <CommentItem
        date="18 feb"
        name="Yxxx Oxxx"
        text="Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
        photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
      /> */}
      {comments !== null ? (
        comments.map((s, i) => (
          <CommentItem
            isPending={s.is_verfied}
            resendComment={() => {
              resendComment(s.mid);
              resendCommentApi(s.mid, s.comment);
            }}
            isError={s.isError}
            key={i}
            date={showDate(s.created_at)}
            name={s?.customer?.name}
            text={s?.comment}
            photo="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
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
