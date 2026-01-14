import React, { useState } from "react";
import auth from "services/auth";
import { showErrorNotification } from "store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { translateFunction } from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { REQUESTS_DATA } from "utils/Requests";

function ProductLikeButton({
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
  const [totalLikes, setTotalLikes] = useState(total_likes);

  const getLikesCount = () => {
    if (totalLikes > 0) return totalLikes;
    return "";
  };

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
      setTotalLikes(currentLikes);
      setLiked(currentIsLiked);
      // Show error notification
      showErrorNotification(
        translateFunction("Failed to update like status. Please try again.")
      );

      console.error("Like/Unlike error:", error);
    } finally {
      setLikeLoading(false);
    }
  };
  return (
    <div
      className={`product-option-item flex-row ${
        likeLoading && "opacity-80 scale-90"
      } transition-all`}
      data-cy="LoveSymbol"
      onClick={() => {
        setLiked(!isLikedState);
        if (isLikedState) LikeProduct(false);
        else LikeProduct(true);
      }}
    >
      {isLikedState ? (
        <img src="/icons/HeartFill.svg" data-cy="LoveClickOnLast" />
      ) : (
        <img src="/icons/Heart.svg" />
      )}
      {<span data-cy="CountOfLoves">{getLikesCount()}</span>}
    </div>
  );
}

export default ProductLikeButton;
