"use client";
import { formatCount } from "utils/formatCount";
import { useCommentLike } from "./useCommentLike";

export function LikeButton({
  comment_id,
  target_type,
  productId,
  disabled = false,
  is_liked,
  total_likes,
  language = "en",
}) {
  const {
    isLiked,
    likes,
    loading,
    realId,
    react: ReactOnComment,
  } = useCommentLike({
    comment_id,
    target_type,
    productId,
    is_liked,
    total_likes,
    language,
  });

  const getCommentId = () => {
    let id = comment_id;
    const isReply = target_type === "seller_reply";
    if (isReply) {
      id = id + "reply";
    }
    id = id + "reaction";

    return id;
  };
  return (
    <div
      id={`${getCommentId()}`}
      data-pw="comment-like"
      // `realId` on purpose: a seller reply's heart is handed
      // `<id>-seller_reply`, and a locator built from the comment id alone would
      // match nothing. `data-target-type` is what separates the two hearts.
      data-comment-id={realId}
      data-target-type={target_type}
      data-liked={isLiked ? "true" : "false"}
      // The visible count is short (`formatCount`: "1.2K"); this carries the raw
      // number so nothing has to parse it back.
      data-likes={likes ?? 0}
      className={`${loading && "opacity-65 scale-90"} ${
        isLiked && "comment-liked"
      }  flex items-center gap-[4px] text-[#1d1d1d] text-[9px] regular cursor-pointer select-none `}
      onClick={ReactOnComment}
    >
      {/* liked svg */}
      <svg
        id="liked-heart"
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 11 11"
        className={`heart liked  scale-[1.2]`}
        fill="url(#heartGradient)"
      >
        <path
          d="M5.5 9.79L4.85 9.24C2.43 7.13 1 5.66 1 3.94
       1 2.51 2.02 1.46 3.45 1.46
       c0.8 0 1.57.37 2.05.95
       0.48-.58 1.25-.95 2.05-.95
       1.43 0 2.45 1.05 2.45 2.48
       0 1.72-1.43 3.19-3.85 5.3L5.5 9.79z"
          strokeWidth={"0.5"}
          stroke={"transparent"}
          fill={"url(#heartGradient77)"}
        />
      </svg>
      {/* Not Liked */}
      <svg
        id="not-liked-heart"
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 11 11"
        className={`heart  scale-[1.2]`}
      >
        <path
          d="M5.5 9.79L4.85 9.24C2.43 7.13 1 5.66 1 3.94
       1 2.51 2.02 1.46 3.45 1.46
       c0.8 0 1.57.37 2.05.95
       0.48-.58 1.25-.95 2.05-.95
       1.43 0 2.45 1.05 2.45 2.48
       0 1.72-1.43 3.19-3.85 5.3L5.5 9.79z"
          strokeWidth={"0.5"}
          stroke={"#1d1d1d"}
          fill={"transparent"}
        />
      </svg>
      <span data-pw="comment-like-count">{formatCount(likes, language)}</span>
    </div>
  );
}
