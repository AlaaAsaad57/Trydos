import { useEffect, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";
import HeartFill from "public/svg/HeartFill.svg";
import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";
import Skeleton from "react-loading-skeleton";
import { RoundPrice, translateFunction } from "utils/functions";
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
    if (bool) {
      editInfo({ likes: SelectedProduct?.likes + 1, is_liked: true });
      try {
        let res = await fetchData({
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
        fetch(
          `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${language}&country=${country}`
        );
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product?.id,
            item_name: product?.name,
            action: "like",
            category: product?.category?.name,
            brand: product?.brand?.name,
            price: RoundPrice({
              num: product?.offer_price,
              rate: currency.exchange_rate,
              returnNumber: true,
            }),
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      } catch (error) {
        setLoading(false);
        editInfo({ likes: SelectedProduct?.likes, is_liked: true });
      }
    } else {
      setLiked(false);
      editInfo({ likes: SelectedProduct?.likes - 1, is_liked: false });
      try {
        let res = await fetchData({
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
        fetch(
          `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${language}&country=${country}`
        );
        GAevent({
          action: GA_EVENT_NAMES.LIKE_ITEM,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product?.id,
            item_name: product?.name,
            action: "dislike",
            category: product?.category?.name,
            brand: product?.brand?.name,
            price: RoundPrice({
              num: product?.offer_price,
              rate: currency.exchange_rate,
              returnNumber: true,
            }),
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
          },
        });
        home.UnsubscripeFromTopic({
          topic: `product_availability_${SelectedProduct?.id}`,
        });
        home.UnsubscripeFromTopic({
          topic: `product_discount_${SelectedProduct?.id}`,
        });
        home.UnsubscripeFromTopic({
          topic: `product_comment_${SelectedProduct?.id}`,
        });
      } catch (error) {
        editInfo({ likes: SelectedProduct?.likes + 1, is_liked: false });
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    editInfo({
      likes: product.count_of_likes,
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
  return (
    <div className="product-options-container" style={{ zIndex: "999999999" }}>
      {share ? (
        <ShareButton onClick={() => shareAction()} />
      ) : (
        <>
          <AddToCartButton product={SelectedProduct} />
          <div className="options-container" data-cy="InteraCtionBoX">
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
                if (isLiked || SelectedProduct?.is_liked) LikeProduct(false);
                else LikeProduct(true);
              }}
            >
              {SelectedProduct?.is_liked || isLiked ? (
                <HeartFill data-cy="LoveClickOnLast" />
              ) : (
                <Heart />
              )}
              {product.count_of_likes >= 0 || SelectedProduct?.likes >= 0 ? (
                <span data-cy="CountOfLoves">
                  {SelectedProduct?.likes || product?.count_of_likes}
                </span>
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
