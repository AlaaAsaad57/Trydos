import React from "react";
import Comment from "public/svg/Comment.svg";
import ActiveCommentIcon from "public/svg/ActiveComment.svg";
function CommentIcon({ active }) {
  return <>{active ? <ActiveCommentIcon /> : <Comment />}</>;
}

export default CommentIcon;
