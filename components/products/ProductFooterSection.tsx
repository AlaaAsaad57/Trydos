import React from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";

function ProductFooterSection({ product }: { product: ProductInterface }) {
  return (
    <div className="product-details-footer">
      <ProductInfo
        currency={product.price_formatted.split(" ")[1]}
        newPrice={product.offer_price}
        oldPrice={product.price}
      />
      <ExtendedAreaInfo />
      <ProductOptions />
    </div>
  );
}

export default ProductFooterSection;
