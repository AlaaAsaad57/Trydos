"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import home from "services/home";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { translateFunction } from "utils/functions";

export function LikeButton({
  comment_id,
  target_type,
  productId,
  disabled = false,
  is_liked,
  total_likes,
}) {
  const [isLiked, setIsLiked] = useState(is_liked || false);
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(total_likes || 0);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();
  const { setLoginOpen } = useAppStore();
  const ReactOnComment = async () => {
    let user_cookies = getCookie(COOKIE_NAMES.USER_ID_HASH);
    if (!user_cookies) {
      setLoginOpen(true);
      showErrorNotification(translateFunction("Please Login First"));
      return;
    }
    if (animating) return;
    setAnimating(true);
    const previousIsLiked = isLiked;
    const previousLikes = likes;
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      setLoading(true);
      if (isLiked) {
        await home.UnLikeComment({
          comment_id: comment_id,
          target_type: target_type,
          product_id: productId,
        });
      } else {
        await home.LikeComment({
          comment_id: comment_id,
          target_type: target_type,
          product_id: productId,
        });
      }
      router.refresh();
      // handleLikeAction(!isLiked, isLiked ? likes - 1 : likes + 1);
      setLoading(false);
    } catch (error) {
      // Revert to previous state if error occurred
      setLoading(false);
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
    } finally {
      setLoading(false);
      // small delay to allow the animation to finish
      setTimeout(() => setAnimating(false), 400);
    }
  };

  const getCommentId = () => {
    let id = comment_id;
    const isReply = target_type === "seller_reply";
    if (isReply) {
      id = id + "reply";
    }
    id = id + "reaction";

    return id;
  };
  useEffect(() => {
    setIsLiked(is_liked);
    setLikes(total_likes);
  }, [is_liked, total_likes]);
  return (
    <div
      id={`${getCommentId()}`}
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
      <span>{likes.toLocaleString()}</span>
    </div>
  );
}
