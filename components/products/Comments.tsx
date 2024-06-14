import React, { useEffect } from "react";
import CommentItem from "./CommentItem";
import { showDate } from "components/Chat/chatsFunctions";
import Skeleton from "react-loading-skeleton";

function Comments({ comments, Render }) {
  useEffect(() => {
    console.log(comments);
  }, [Render]);
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
            isError={s.is_verfied}
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
