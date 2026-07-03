"use client";
import { useEffect, useState } from "react";
import home from "services/home";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";

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
  const { setLoginOpen, patchCommentEntity } = useAppStore();
  // Seller-reply likes live on the parent comment entity under reply_* fields;
  // strip the suffix to reach the real comment id.
  const isReplyTarget = target_type === "seller_reply";
  const realId = isReplyTarget
    ? String(comment_id).replace(/-seller_reply$/, "")
    : String(comment_id);
  const syncEntity = (liked: boolean, count: number) =>
    patchCommentEntity(
      realId,
      isReplyTarget
        ? { reply_is_liked: liked, reply_total_likes: count }
        : { is_liked: liked, total_likes: count },
    );
  const ReactOnComment = async () => {
    let user_cookies = useAppStore.getState().userProfile?.id;
    if (!user_cookies) {
      setLoginOpen(true);
      showErrorNotification(translateFunction("Please Login First"));
      return;
    }
    if (animating) return;
    setAnimating(true);
    const previousIsLiked = isLiked;
    const previousLikes = likes;
    const nextIsLiked = !isLiked;
    const nextLikes = isLiked ? likes - 1 : likes + 1;
    setIsLiked(nextIsLiked);
    setLikes(nextLikes);
    // Push to the shared entity so the same comment updates in every widget
    // (list, modal, extended) instantly — no router.refresh (which would
    // re-seed from a not-yet-indexed Elasticsearch and revert the like).
    syncEntity(nextIsLiked, nextLikes);

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
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In ReactOnComment in LikeButton",
      });
      setLoading(false);
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      syncEntity(previousIsLiked, previousLikes);
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
