"use client";
import React, { useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";
import ShareButton from "./ShareButton";

function ProductFooterSection({ product }: { product: ProductInterface }) {
  const [option, setOption] = useState("");
  const [sharedContacts, setShareContacts] = useState([]);
  return (
    <div className="product-details-footer">
      <ProductInfo
        currency={product.price_formatted.split(" ")[1]}
        newPrice={product.offer_price}
        oldPrice={product.price}
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
