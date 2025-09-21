import { useEffect, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";
import HeartFill from "public/svg/HeartFill.svg";
import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";
import Skeleton from "react-loading-skeleton";
import { translateFunction } from "utils/functions";
import home from "services/home";
import auth from "services/auth";
import { useAppStore } from "store";
import { ProductOptionsPropsType } from "models/componentType/ProductOptionsPropsType";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";
import { useParams } from "node_modules/next/navigation";

function ProductOptions({
  activeOption,
  setOption,
  clearShare,
  share,
  productDetails,
  product,
  shareAction,
  loading,
}: ProductOptionsPropsType) {
  const { editInfo, currency, SelectedProduct } = useAppStore();
  const [isLiked, setLiked] = useState(false);
  const [likeLoading, setLoading] = useState(false);
  const params = useParams();
  // @ts-ignore
  const [country, language] = params.lang.split("-");

  const LikeProduct = async (bool) => {
    if (likeLoading) return;
    setLoading(true);

    // Store current state for potential rollback
    const currentLikes = SelectedProduct?.likes || 0;
    const currentIsLiked = SelectedProduct?.is_liked || false;

    try {
      if (bool) {
        // Like product
        const res = await fetchData({
          url: "/product_likes/store",
          reqTitle: REQUESTS_DATA.LIKE_FOR_PRODUCT,
          method: "POST",
          server: "market",
          body: JSON.stringify({
            product_id: product.id,
            user_id: auth.UserID(),
          }),
        });

        if (!res.success) {
          throw new Error(res.message);
        }

        // Only update state after successful API call
        editInfo({
          likes: Math.max(0, currentLikes + 1),
          is_liked: true,
        });

        // Update social product data
        fetch(
          `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${language}&country=${country}`
        );

        // Track GA event
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product?.id,
            item_name: product?.name,
            action: "like",
            category: product?.category?.name,
            brand: product?.brand?.name,
            price: product?.offer_price,
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      } else {
        // Unlike product
        const res = await fetchData({
          url: "/product_likes/delete",
          reqTitle: REQUESTS_DATA.UNLIKE_PRODUCT,
          method: "POST",
          server: "market",
          body: JSON.stringify({
            product_id: product.id,
            user_id: auth.UserID(),
          }),
        });

        if (!res.success) {
          throw new Error(res.message);
        }

        // Only update state after successful API call
        editInfo({
          likes: Math.max(0, currentLikes - 1),
          is_liked: false,
        });

        // Update social product data
        fetch(
          `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${language}&country=${country}`
        );

        // Track GA event
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product?.id,
            item_name: product?.name,
            action: "dislike",
            brand: product?.brand?.name,
            brand_id: product?.brand?.id,
            category: product?.category?.name || product?.categories?.[0]?.name,
            category_id: product?.category?.id || product?.categories?.[0]?.id,
            price: product?.offer_price,
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });

        // Unsubscribe from topics
        home.UnsubscripeFromTopic({
          topic: `product_availability_${SelectedProduct?.id}`,
        });
        home.UnsubscripeFromTopic({
          topic: `product_discount_${SelectedProduct?.id}`,
        });
        home.UnsubscripeFromTopic({
          topic: `product_comment_${SelectedProduct?.id}`,
        });
      }
    } catch (error) {
      // Rollback to previous state on error
      editInfo({
        likes: currentLikes,
        is_liked: currentIsLiked,
      });

      // Show error notification
      showErrorNotification(
        translateFunction("Failed to update like status. Please try again.")
      );

      console.error("Like/Unlike error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    editInfo({
      likes: Math.max(0, product.count_of_likes || 0),
      comments: product.comments,
      shares_count: product.shares_count,
    });
    if (product.is_country_restricted) {
      showErrorNotification(
        translateFunction("Sorry This Product Not Available In Your Country")
      );
    }
    if (product.is_active === false) {
      showErrorNotification(
        translateFunction("Sorry This Product Not Available Now")
      );
    }
  }, []);
  const getSafeLikeCount = () => {
    const likes = SelectedProduct?.likes ?? product?.count_of_likes ?? 0;
    return Math.max(0, likes);
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`product-options-container ${isRtl && "flex-row-reverse"}`}
      style={{ zIndex: "999999999" }}
    >
      {share ? (
        <ShareButton onClick={() => shareAction()} />
      ) : (
        <>
          <AddToCartButton product={SelectedProduct} />
          <div
            className={`options-container ${isRtl && "flex-row-reverse"}`}
            data-cy="InteraCtionBoX"
          >
            <div
              className={`product-option-item ${
                likeLoading && "opacity-80 scale-90"
              } transition-all ${activeOption === "Like" && "active-option"}`}
              data-cy="LoveSymbol"
              onClick={() => {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.LIKE_PRODUCT_BUTTON,
                // });
                setOption("Like");
                setLiked(!isLiked);
                if (SelectedProduct?.is_liked) LikeProduct(false);
                else LikeProduct(true);
              }}
            >
              {SelectedProduct?.is_liked ? (
                <HeartFill data-cy="LoveClickOnLast" />
              ) : (
                <Heart />
              )}
              {product.count_of_likes >= 0 || SelectedProduct?.likes >= 0 ? (
                <span data-cy="CountOfLoves">{getSafeLikeCount()}</span>
              ) : (
                <Skeleton width={15} height={14}></Skeleton>
              )}
            </div>
            <div
              className="product-option-item"
              data-cy="CommentIcon"
              onClick={() => {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.SHOW_COMMENTS_BUTTON,
                // });
                setOption("Comment");
              }}
            >
              <CommentIcon active={activeOption === "Comment"} />
              <span data-cy="CountOfComment">
                {productDetails.comments_count !== null ||
                product.comments_count !== null ? (
                  productDetails.comments_count ?? product.comments_count ?? 0
                ) : (
                  <Skeleton width={15} height={14}></Skeleton>
                )}
              </span>
            </div>
            <div
              className={`product-option-item relative ${
                activeOption === "Share" && "active-option"
              }`}
              data-cy="ShareIcon"
              onClick={() => {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.SHARE_PRODUCT_BUTTON,
                // });
                setOption("Share");
              }}
            >
              {" "}
              <Share />
              <span data-cy="CountOfShares">
                {(SelectedProduct?.sharesCount !== null &&
                  SelectedProduct?.sharesCount >= 0) ||
                product?.shared_count >= 0 ? (
                  SelectedProduct?.sharesCount ?? product.shared_count
                ) : (
                  <Skeleton width={15} height={14}></Skeleton>
                )}
              </span>
            </div>
            <div
              className="product-option-item"
              data-cy="ThreePointsIcon"
              onClick={() => {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.MORE_OPTIONS_BUTTON,
                // });
                setOption("More");
              }}
            >
              <ThreePoints active={activeOption === "More"} />
              <span></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductOptions;
