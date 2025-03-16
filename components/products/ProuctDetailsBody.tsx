"use client";
import { ProductInterface } from "models/product";
import React, { useEffect } from "react";
import "styles/product-body.css";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import ProductDetailsText from "./ProductDetailsText";
import ProductProperties from "./ProductProperties";
import ProductDescriptors from "./ProductDescriptors";
import ProductColors from "./ProductColors";
import ProductSizes from "./ProductSizes";
// import CameraShots from "./CameraShots";
import ProductStories from "./ProductStories";
import ProductShippingOption from "./ProductShippingOption";
import FreeReturnOption from "./FreeReturnOption";
import FreeShippingOption from "./FreeShippingOption";
import { useSelector } from "react-redux";
import Skeleton from "react-loading-skeleton";
import { Sendevent } from "utils/functions";
import CameraShots from "./CameraShots";

function ProuctDetailsBody({ product }) {
  const SelectedProduct = useSelector(
    (state: StateInterface) => state.cart.SelectedProduct
  );
  useEffect(() => {
    setTimeout(() => {
      Sendevent({
        event: "viewed_product",
        extra: {
          product_name: product.name,
          product_id: product.id,
          product_categories: product.categories?.map((s) => s.id),
        },
      });
    }, 4000);
  }, []);
  return (
    <div className="product-details-body flex-row relative">
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
      <div className="product-info-section flex-col align-start">
        <div className="product-brand-logo">
          {product?.brand?.icon && (
            <img
              width={"auto"}
              height={18}
              src={product.brand.icon}
              alt={product.brand.name}
            />
          )}
        </div>
        <div className="product-text-section flex-row align-center">
          <div className="product-name" data-cy="productName_productPage">
            {product.name}
          </div>
          <div className="product-category">
            {product?.category?.icon && (
              <img
                width={15}
                height={15}
                src={product.category.icon}
                alt={product.category.name}
              />
            )}
          </div>
          <span className="separtor">|</span>

          <div className="product-category-name">{product.category?.name}</div>
        </div>

        <ProductDetailsText product={product} details={product.details} />
        <ProductProperties />
        <ProductDescriptors descriptors={product.descriptors} />
        <ProductColors
          colors={product.sync_color_images || []}
          ProductColorsArray={product.colors}
        />
        <CameraShots images={product?.images || []} />
        <ProductStories />
        <ProductSizes
          sizes={
            product?.choice_options?.filter((s) => s.title == "Size")[0]
              ?.options || []
          }
        />
        <ProductShippingOption />
        {product.shipping_cost === 0 && <FreeShippingOption />}
        <FreeReturnOption />
      </div>
    </div>
  );
}

export default ProuctDetailsBody;
