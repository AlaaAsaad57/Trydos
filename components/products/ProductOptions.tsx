import React, { useEffect, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";
import HeartFill from "public/svg/HeartFill.svg";

import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";
import Skeleton from "react-loading-skeleton";
import { useDispatch, useSelector } from "react-redux";
import { Sendevent, UserID, UserToken } from "utils/functions";
import axios from "axios";
import home from "services/home";
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
  const loaded = useSelector((state: any) => state.cart.loaded);
  const sharesCount = useSelector((state: any) => state.details.sharesCount);
  const SelectedProduct = useSelector(
    (state: any) => state.cart.SelectedProduct
  );
  const [shareEnable, setShare] = useState(false);
  const [isLiked, setLiked] = useState(false);
  const dispatch = useDispatch();
  const LikeProduct = async (bool) => {
    if (bool) {
      dispatch({
        type: "EDIT-INFO",
        payload: { likes: SelectedProduct?.likes + 1, is_liked: true },
      });
      await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + `/product_likes/store`,
        { product_id: product.id, user_id: UserID() },
        {
          headers: {
            Authorization: `Bearer ${UserToken()}`,
          },
        }
      );
      await home.subscribeToTopics(SelectedProduct.slug_en_topic);
    } else {
      setLiked(false);
      dispatch({
        type: "EDIT-INFO",
        payload: { likes: SelectedProduct?.likes - 1, is_liked: false },
      });
      axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + `/product_likes/delete`,
        { product_id: product.id, user_id: UserID() },
        {
          headers: {
            Authorization: `Bearer ${UserToken()}`,
          },
        }
      );
    }
  };
  return (
    <div className="product-options-container">
      {share ? (
        <ShareButton onClick={() => shareAction()} />
      ) : (
        <>
          <AddToCartButton
            setOption={(s) => setOption(s)}
            productVar={product}
            product={SelectedProduct}
            loading={loaded && SelectedProduct.choice_options}
          />
          <div className="options-container">
            <div
              className={`product-option-item ${
                activeOption === "Like" && "active-option"
              }`}
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
              {SelectedProduct?.is_liked || isLiked ? <HeartFill /> : <Heart />}
              {loading ? (
                <Skeleton width={15} height={14}></Skeleton>
              ) : (
                <span>{SelectedProduct?.likes}</span>
              )}
            </div>
            <div
              className="product-option-item"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "show_comments_button",
                });
                setOption("Comment");
              }}
            >
              <CommentIcon active={activeOption === "Comment"} />
              <span>
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
              <span>
                {sharesCount !== null && sharesCount >= 0 ? (
                  sharesCount
                ) : (
                  <Skeleton width={15} height={14}></Skeleton>
                )}
              </span>
            </div>
            <div
              className="product-option-item"
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
