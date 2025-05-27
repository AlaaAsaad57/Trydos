import Image from "next/image";
import React from "react";
import "styles/comment.css";
import Loading from "public/svg/loading.svg";

function CommentItem({
  name,
  photo,
  date,
  text,
  isPending,
  isError,
  resendComment,
}: {
  name: string;
  photo: string;
  date: string;
  text: string;
  isPending: any;
  isError: any;
  resendComment: Function;
}) {
  return (
    <div
      className="comment-item"
      style={{
        opacity: isPending === true ? "1" : isPending === null ? "1" : "0.7",
        backgroundColor: isError ? "#ffd6d6" : "#f8f8f8",
        position: "relative",
      }}
    >
      {isError && (
        <Loading
          style={{ position: "absolute", right: "10px", bottom: "10px" }}
          onClick={() => {
            resendComment();
          }}
        />
      )}
      <div className="comment-photo">
        <Image src={photo} width={20} height={20} alt={name} />
      </div>
      <div className="comment-content">
        <div className="comment-source" data-cy="Source-Of-Comment">
          {name}
        </div>
        <div className="comment-text">{text}</div>
      </div>
      <div className="comment-date" data-cy="Date-Of-Comment">
        {date}
      </div>
    </div>
  );
}

export default CommentItem;
