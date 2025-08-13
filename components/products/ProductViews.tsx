"use client";
import React, { useEffect } from "react";

import EyeIcon from "public/svg/product/EyeIcon.svg";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";

function ProductViews() {
  const { SelectedProduct } = useAppStore();
  console.log(SelectedProduct);
  return (
    <div className="view-count absolute flex-row align-center">
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
