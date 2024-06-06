"use client";
import React, { useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";
import { store } from "store";
import ProductDetails from "./ProductDetails";

function ProductFooterSection({
  product,
  slug,
}: {
  slug: string;
  product: ProductInterface;
}) {
  const [option, setOption] = useState("");
  const [sharedContacts, setShareContacts] = useState([]);
  const productData =
    product ??
    store.getState().listing.products.filter((s) => s.slug === slug)[0];

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
