import Image from "next/image";
import React from "react";
import "styles/comment.css";
function CommentItem({
  name,
  photo,
  date,
  text,
}: {
  name: string;
  photo: string;
  date: string;
  text: string;
}) {
  return (
    <div className="comment-item">
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
