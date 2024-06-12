"use client";
import React, { useEffect, useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";

import ProductDetails from "./ProductDetails";
import axios from "axios";
import { OTP_URL } from "utils/endpointConfig";

function ProductFooterSection({ product }: { product: ProductInterface }) {
  const [option, setOption] = useState("");
  const [productDetails, setProductData] = useState({
    comment_count: null,
    comments: null,
    shares: null,
    likes: null,
  });
  const [sharedContacts, setShareContacts] = useState([]);
  const productData = product;
  const getData = async () => {
    let req = await axios.get(
      OTP_URL + "/web/product/likesCommentsSharesDetails/" + product.id
    );
    setProductData({
      ...productDetails,
      comment_count: req.data.data.comments_count,
      comments: req.data.data.comments,
    });
  };
  useEffect(() => {
    getData();
  }, []);
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
          product={product}
          comments={productDetails.comments}
          sharedContacts={sharedContacts}
          setShareContacts={(e) => setShareContacts(e)}
          active={option.length > 0 && option !== "Like"}
          option={option}
        />
      }

      <ProductOptions
        clearShare={() => setShareContacts([])}
        productDetails={productDetails}
        share={sharedContacts.length > 0}
        activeOption={option}
        setOption={(e) => setOption(e)}
      />
    </div>
  );
}

export default ProductFooterSection;
