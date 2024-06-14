import Image from "next/image";
import React from "react";
import "styles/comment.css";
function CommentItem({
  name,
  photo,
  date,
  text,
  isPending,
  isError,
}: {
  name: string;
  photo: string;
  date: string;
  text: string;
  isPending: any;
  isError: any;
}) {
  return (
    <div
      className="comment-item"
      style={{
        opacity: isPending === true ? "1" : isPending === null ? "1" : "0.7",
        backgroundColor: isError ? "red" : "#f8f8f8",
      }}
    >
      <div className="comment-photo">
        <Image src={photo} unoptimized width={20} height={20} alt={name} />
      </div>
      <div className="comment-content">
        <div className="comment-source">{name}</div>
        <div className="comment-text">{text}</div>
      </div>
      <div className="comment-date">{date}</div>
    </div>
  );
}

export default CommentItem;
