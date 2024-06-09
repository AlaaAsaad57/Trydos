"use client";
import React, { useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";

import ProductDetails from "./ProductDetails";

function ProductFooterSection({ product }: { product: ProductInterface }) {
  const [option, setOption] = useState("");
  const [sharedContacts, setShareContacts] = useState([]);
  const productData = product;
  console.log(product);
  return (
    <div className="product-details-footer">
      <ProductDetails />
      <ProductInfo
        currency={productData.price_formatted.split(" ")[1]}
        newPrice={productData.offer_price}
        oldPrice={productData.price}
      />
      {
        <ExtendedAreaInfo
          sharedContacts={sharedContacts}
          setShareContacts={(e) => setShareContacts(e)}
          active={option.length > 0 && option !== "Like"}
          option={option}
        />
      }

      <ProductOptions
        clearShare={() => setShareContacts([])}
        share={sharedContacts.length > 0}
        activeOption={option}
        setOption={(e) => setOption(e)}
      />
    </div>
  );
}

export default ProductFooterSection;
