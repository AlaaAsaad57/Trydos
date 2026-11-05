import { useEffect, useState } from "react";
import home from "services/home";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";

/**
 * The like of a review, a question or a seller's answer. The old heart
 * (`LikeButton`) and the new product page's cards (Stage 7c) both use it.
 */
export function useCommentLike({
  comment_id,
  target_type,
  productId,
  is_liked,
  total_likes,
  language = "en",
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
      const target = {
        comment_id: comment_id,
        target_type: target_type,
        product_id: productId,
      };
      // The service answers false on a refusal (fetchData never throws), so
      // the heart must be put back here, not only in the catch below.
      const accepted = isLiked
        ? await home.UnLikeComment(target)
        : await home.LikeComment(target);
      if (!accepted) {
        throw new Error("the comments backend refused the like");
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
      showErrorNotification(
        translateFunction(
          "Failed to update like status. Please try again.",
          language,
        ),
      );
    } finally {
      setLoading(false);
      // small delay to allow the animation to finish
      setTimeout(() => setAnimating(false), 400);
    }
  };

  useEffect(() => {
    setIsLiked(is_liked);
    setLikes(total_likes || 0);
  }, [is_liked, total_likes]);

  return { isLiked, likes, loading, realId, react: ReactOnComment };
}
