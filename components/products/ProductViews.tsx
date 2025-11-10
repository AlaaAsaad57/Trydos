"use client";
import React from "react";
import EyeIcon from "public/svg/product/EyeIcon";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";

function ProductViews() {
  const { SelectedProduct } = useAppStore();

  return (
    <div className="view-count flex-row align-center">
      <EyeIcon />
      {SelectedProduct?.views_count >= 0 ? (
        <span>{SelectedProduct.views_count ?? "1"}</span>
      ) : (
        <span className="m-0">
          <Skeleton className="m-0" count={1} width={20} height={10} />
        </span>
      )}
    </div>
  );
}

export default ProductViews;
