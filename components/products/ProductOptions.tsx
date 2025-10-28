import { useEffect, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";
import HeartFill from "public/svg/HeartFill.svg";
import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";

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
import { useParams, useSearchParams } from "node_modules/next/navigation";

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
  const searchParams = useSearchParams();
  useEffect(() => {
    const color = searchParams.get("color");
    const size = searchParams.get("size");
    editInfo({
      likes: Math.max(0, product.count_of_likes || 0),
      comments: product.comments,
      shares_count: product.shares_count,
      ActiveColor:
        (color &&
          product?.sync_color_images?.find((s) => s.color_option === color)
            ?.color_option) ??
        product?.sync_color_images?.[0]?.color_option ??
        null,
      ActiveSize:
        (size &&
          product?.choice_options?.[0]?.options?.find((s) => s.option === size)
            ?.option) ??
        product?.choice_options?.[0]?.options?.[0]?.option ??
        null,
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
    const likes = SelectedProduct?.likes ?? product?.count_of_likes ?? "";
    return Math.max(0, likes);
  };
  const isRtl = language === "ar" || language === "ku";
  const getSharesCount = () => {
    if (SelectedProduct?.sharesCount > 0) return SelectedProduct?.sharesCount;
    if (product?.shared_count > 0) return product?.shared_count;
    return "";
  };
  const getCommentsCount = () => {
    if (SelectedProduct?.fqa_questions?.total > 0)
      return SelectedProduct?.fqa_questions?.total;
    if (productDetails?.comments_count > 0)
      return productDetails?.comments_count;
    if (product?.fqa_questions?.total > 0) return product?.fqa_questions?.total;
    return "";
  };
  const getLikesCount = () => {
    let num = getSafeLikeCount();
    if (num > 0) return num;
    return "";
  };
  return (
    <div
      className={`product-options-container ${isRtl && "flex-row-reverse"}`}
      style={{ zIndex: "999999999" }}
    >
      {share ? (
        <ShareButton onClick={() => shareAction()} />
      ) : (
        <>
          <div
            className={`options-container relative w-full  justify-between flex flex-row pb-[35px] pt-[8px] h-[68px] px-[20px] ${
              isRtl && "flex-row-reverse"
            }`}
            data-cy="InteraCtionBoX"
          >
            <AddToCartButton product={SelectedProduct ?? true} />
            <div
              className={`flex justify-between w-full ${
                isRtl && "flex-row-reverse"
              }`}
            >
              <div
                className={`product-option-item flex-row ${
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
                {<span data-cy="CountOfLoves">{getLikesCount()}</span>}
              </div>
              <div
                className="product-option-item flex-row"
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
                <span data-cy="CountOfComment">{getCommentsCount()}</span>
              </div>
            </div>
            <div className="min-w-[130px]" />
            <div
              className={`${
                isRtl && "flex-row-reverse"
              } flex justify-between w-full`}
            >
              <div
                className={`product-option-item relative flex-row ${
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
                <span data-cy="CountOfShares">{getSharesCount()}</span>
              </div>
              <div
                className="product-option-item flex-row"
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
          </div>
        </>
      )}
    </div>
  );
}

export default ProductOptions;
