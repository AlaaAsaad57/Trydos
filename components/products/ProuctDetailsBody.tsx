import { ProductInterface } from "models/product";
import React from "react";
import "styles/product-body.css";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import ProductDetailsText from "./ProductDetailsText";
import ProductProperties from "./ProductProperties";
function ProuctDetailsBody({ product }: { product: ProductInterface }) {
  return (
    <div className="product-details-body flex-row relative">
      <div className="view-count absolute flex-row align-center">
        <EyeIcon />
        <span>{product.views_count}</span>
      </div>
      <div className="product-info-section flex-col align-start">
        <div className="product-brand-logo">
          <img
            width={"auto"}
            height={18}
            src={product.brand.image}
            alt={product.brand.name}
          />
        </div>
        <div className="product-text-section flex-row align-center">
          <div className="product-name">{product.name}</div>
          <div className="product-category">
            <img
              width={15}
              height={15}
              src={product.category.icon}
              alt={product.category.name}
            />
          </div>
          <span className="separtor">|</span>

          <div className="product-category-name">{product.category.name}</div>
        </div>
        <ProductDetailsText details={product.details} />
        <ProductProperties />
      </div>
    </div>
  );
}

export default ProuctDetailsBody;
