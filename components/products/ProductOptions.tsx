import { useEffect, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";
import HeartFill from "public/svg/HeartFill.svg";

import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";
import Skeleton from "react-loading-skeleton";

import { Sendevent, translateFunction } from "utils/functions";
import home from "services/home";
import { AxiosPost } from "utils/AxiosApi";
import { toast } from "react-toastify";
import auth from "services/auth";
import { useAppStore } from "store";

function ProductOptions({
  activeOption,
  setOption,
  clearShare,
  share,
  productDetails,
  product,
  shareAction,
  loading,
}: {
  activeOption: string;
  shareAction: any;
  setOption: (e: string) => void;
  clearShare: () => void;
  share: boolean;
  productDetails: any;
  product: any;
  loading: boolean;
}) {
  const { editInfo, loaded, sharesCount, SelectedProduct } = useAppStore();
  const [isLiked, setLiked] = useState(false);
  const LikeProduct = async (bool) => {
    let language_code = window.location.pathname.split("/")[1].split("-")[1];
    let country_code = window.location.pathname.split("/")[1].split("-")[0];
    if (bool) {
      editInfo({ likes: SelectedProduct?.likes + 1, is_liked: true });
      try {
        await AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + `/product_likes/store`,
          title: "like For Product",
          body: { product_id: product.id, user_id: auth.UserID() },
        });
        // home.subscribeToTopic({
        //   topic: `product_availability_${SelectedProduct?.id}`,
        // });
        // home.subscribeToTopic({
        //   topic: `product_discount_${SelectedProduct?.id}`,
        // });
        // home.subscribeToTopic({
        //   topic: `product_comment_${SelectedProduct?.id}`,
        // });
      } catch (error) {
        editInfo({ likes: SelectedProduct?.likes, is_liked: true });
      }
    } else {
      setLiked(false);
      editInfo({ likes: SelectedProduct?.likes - 1, is_liked: false });
      try {
        AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + `/product_likes/delete`,
          title: "unlike For Product",
          body: { product_id: product.id, user_id: auth.UserID() },
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
  };
  useEffect(() => {
    if (product.is_country_restricted) {
      toast.error(
        translateFunction("Sorry This Product Not Available In Your Country")
      );
    }
    if (product.is_active === false) {
      toast.error(translateFunction("Sorry This Product Not Available Now"));
    }
  }, []);
  return (
    <div
      className="product-options-container"
      style={{ zIndex: "99999999999999" }}
    >
      {share ? (
        <ShareButton onClick={() => shareAction()} />
      ) : (
        <>
          <AddToCartButton product={SelectedProduct} />
          <div className="options-container" data-cy="InteraCtionBoX">
            <div
              className={`product-option-item ${
                activeOption === "Like" && "active-option"
              }`}
              data-cy="LoveSymbol"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "like_product_button",
                });
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
              {loading ? (
                <Skeleton width={15} height={14}></Skeleton>
              ) : (
                <span data-cy="CountOfLoves">{SelectedProduct?.likes}</span>
              )}
            </div>
            <div
              className="product-option-item"
              data-cy="CommentIcon"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "show_comments_button",
                });
                setOption("Comment");
              }}
            >
              <CommentIcon active={activeOption === "Comment"} />
              <span data-cy="CountOfComment">
                {productDetails.comment_count !== null ? (
                  productDetails.comment_count
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
                Sendevent({
                  event: "button_clicked",
                  value: "share_product_button",
                });
                setOption("Share");
              }}
            >
              {" "}
              <Share />
              <span data-cy="CountOfShares">
                {sharesCount !== null && sharesCount >= 0 ? (
                  sharesCount
                ) : (
                  <Skeleton width={15} height={14}></Skeleton>
                )}
              </span>
            </div>
            <div
              className="product-option-item"
              data-cy="ThreePointsIcon"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "more_options_button",
                });
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
