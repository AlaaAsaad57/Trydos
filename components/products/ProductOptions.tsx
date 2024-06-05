import React from "react";
import AddToCartButton from "./AddToCartButton";
import Heart from "public/svg/Heart.svg";

import Share from "public/svg/share.svg";
import CommentIcon from "./CommentIcon";
import ThreePoints from "./ThreePoints";
import ShareButton from "./ShareButton";
function ProductOptions({
  activeOption,
  setOption,
  clearShare,
  share,
}: {
  activeOption: string;
  setOption: (e: string) => void;
  clearShare: () => void;
  share: boolean;
}) {
  return (
    <div className="product-options-container">
      {share ? (
        <ShareButton onClick={() => clearShare()} />
      ) : (
        <>
          <AddToCartButton />
          <div className="options-container">
            <div
              className={`product-option-item ${
                activeOption === "Like" && "active-option"
              }`}
              onClick={() => setOption("Like")}
            >
              <Heart />
              <span>110k</span>
            </div>
            <div
              className="product-option-item"
              onClick={() => setOption("Comment")}
            >
              <CommentIcon active={activeOption === "Comment"} />
              <span>8k</span>
            </div>
            <div
              className={`product-option-item ${
                activeOption === "Share" && "active-option"
              }`}
              onClick={() => setOption("Share")}
            >
              <Share />
              <span>2k</span>
            </div>
            <div
              className="product-option-item"
              onClick={() => setOption("More")}
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
