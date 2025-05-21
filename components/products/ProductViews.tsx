"use client";
import React, { useEffect } from "react";
import { Sendevent } from "utils/functions";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";

function ProductViews({ product }) {
  const { SelectedProduct } = useAppStore();
  useEffect(() => {
    setTimeout(() => {
      Sendevent({
        event: "viewed_product",
        value: product.product_name,
        extra: {
          product_name: product.name,
          product_id: product.id,
          product_categories: product.categories?.map((s) => s.id),
        },
      });
    }, 4000);
  }, []);
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
