"use client";
import React, { useEffect, useReducer, useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";

import ProductDetails from "./ProductDetails";
import axios from "axios";
import { OTP_URL } from "utils/endpointConfig";
function ProductReducer(state, { type, payload }) {
  if (type === "setProductData") {
    return {
      ...state,
      productDetails: payload,
    };
  }
  if (type === "setComments") {
    return {
      ...state,
      CommentsData: payload,
    };
  }
  if (type === "ErrorAccure") {
    let s = state.CommentsData.filter((m) => m.mid === payload)[0];

    return {
      ...state,
      CommentsData: [
        ...state.CommentsData.filter((comment) => comment.mid !== payload),
        { ...s, is_verfied: false, isError: true },
      ],
    };
  }
  if (type === "setRender") {
    return {
      ...state,
      Render: !state.Render,
    };
  }
  if (type === "resendComment") {
    let s = state.CommentsData.filter((m) => m.mid === payload)[0];
    return {
      ...state,
      CommentsData: [
        ...state.CommentsData.filter((comment) => comment.mid !== payload),
        { ...s, is_verfied: false, isError: false },
      ],
    };
  }
}
function ProductFooterSection({ product }: { product: ProductInterface }) {
  const [productState, dispatch] = useReducer(ProductReducer, {
    productDetails: {
      comment_count: null,
      comments: null,
      shares: null,
      likes: null,
    },
    CommentsData: null,
    Render: false,
  });
  const setProductData = (s) => {
    dispatch({ type: "setProductData", payload: s });
  };
  const setComments = (s) => {
    dispatch({ type: "setComments", payload: s });
  };
  const [option, setOption] = useState("");

  const [sharedContacts, setShareContacts] = useState([]);
  const productData = product;
  const getData = async () => {
    let req = await axios.get(
      OTP_URL + "/web/product/likesCommentsSharesDetails/" + product.id
    );
    setProductData({
      ...productState.productDetails,
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
          Render={productState.Render}
          setRender={() => {
            dispatch({ type: "setRender", payload: "" });
          }}
          CommentsData={productState.CommentsData}
          ErrorAccure={(s) => {
            dispatch({ type: "ErrorAccure", payload: s });
          }}
          setComments={(s) => setComments(s)}
          increase_comments={() =>
            setProductData({
              ...productState.productDetails,
              comment_count: productState.productDetails.comment_count + 1,
            })
          }
          product={product}
          comments={productState.productDetails.comments}
          sharedContacts={sharedContacts}
          resendComment={(s) => {
            dispatch({ type: "resendComment", payload: s });
          }}
          setShareContacts={(e) => setShareContacts(e)}
          active={option.length > 0 && option !== "Like"}
          option={option}
        />
      }

      <ProductOptions
        clearShare={() => setShareContacts([])}
        productDetails={productState.productDetails}
        share={sharedContacts.length > 0}
        activeOption={option}
        setOption={(e) => setOption(e)}
      />
    </div>
  );
}

export default ProductFooterSection;
