import { useState } from "react";
import auth from "services/auth";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { LogError, translateFunction } from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { REQUESTS_DATA } from "utils/Requests";

/**
 * The like of a product (comments backend, `like_item`). The old footer's
 * button and the new product page (Stage 7c, S7c-2) both use it.
 */
export function useProductLike({
  total_likes,
  isLiked,
  productId,
  name,
  category,
  brand,
  price,
  brand_id,
  category_id,
}) {
  const [likeLoading, setLikeLoading] = useState(false);
  const [isLikedState, setLiked] = useState(isLiked);
  const setLoginOpen = useAppStore((s) => s.setLoginOpen);
  const [totalLikes, setTotalLikes] = useState(total_likes);

  const LikeProduct = async (bool) => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Store current state for potential rollback
    const currentLikes = totalLikes;
    const currentIsLiked = isLikedState;

    try {
      if (bool) {
        // Like product
        const res = await fetchData({
          url: "/products/like",
          reqTitle: REQUESTS_DATA.LIKE_FOR_PRODUCT,
          method: "POST",
          server: "comments",
          body: JSON.stringify({
            product_id: String(productId),
            user_id: String(auth.UserID()),
          }),
          noMessage: true,
        });

        if (!res.success) {
          throw new Error(res.message);
        }
        setTotalLikes(Math.max(0, currentLikes + 1));
        setLiked(true);

        // Track GA event
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: productId,
            item_name: name,
            action: "like",
            category: category,
            brand: brand,
            brand_id: brand_id,
            price: price,
            category_id: category_id,
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      } else {
        // Unlike product
        const res = await fetchData({
          url: "/products/unlike",
          reqTitle: REQUESTS_DATA.UNLIKE_PRODUCT,
          method: "DELETE",
          server: "comments",
          body: JSON.stringify({
            product_id: String(productId),
            user_id: String(auth.UserID()),
          }),
          noMessage: true,
        });

        if (!res.success) {
          throw new Error(res.message);
        }

        // Only update state after successful API call
        setTotalLikes(Math.max(0, currentLikes - 1));
        setLiked(false);

        // Update social product data

        // Track GA event
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: productId,
            item_name: name,
            action: "dislike",
            brand: brand,
            brand_id: brand_id,
            category: category,
            category_id: category_id,
            price: price,
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });

        // Unsubscribe from topics
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In LikeProduct in ProductLikeProduct",
      });
      setTotalLikes(currentLikes);
      setLiked(currentIsLiked);
      // Show error notification
      showErrorNotification(
        translateFunction("Failed to update like status. Please try again."),
      );

      LogError({ scenario: "ProductLikeButton: like or unlike failed", error });
    } finally {
      setLikeLoading(false);
    }
  };

  const toggle = () => {
    // A second tap while the request runs must not flip the heart: the
    // guard inside LikeProduct would drop the request, and the heart
    // would stay wrong until the first answer lands.
    if (likeLoading) return;
    // A guest has no comments token. Ask for sign-in here, instead of
    // sending a request that only ends in the sign-in prompt 2 s later.
    if (!auth.UserID()) {
      setLoginOpen(true);
      showErrorNotification(translateFunction("Please Login First"));
      return;
    }
    setLiked(!isLikedState);
    if (isLikedState) LikeProduct(false);
    else LikeProduct(true);
  };

  return { liked: isLikedState, totalLikes, loading: likeLoading, toggle };
}
