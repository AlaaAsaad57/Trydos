"use client";
import React, { useEffect, useReducer, useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { ProductInterface } from "models/product";

import ProductDetails from "./ProductDetails";
import axios from "axios";

import SelectColor from "./SelectColor";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAppLanguage,
  RoundPrice,
  translate,
  UserToken,
} from "utils/functions";
import auth from "services/auth";
import { toast } from "react-toastify";
import chat from "services/chat";
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
        { ...s, is_verfied: false, isError: true },
        ...state.CommentsData.filter((comment) => comment.mid !== payload),
        ,
      ],
    };
  }
  if (type === "VerifyComment") {
    let s = state.CommentsData.filter((m) => m.mid === payload)[0];

    return {
      ...state,
      CommentsData: [
        { ...s, is_verfied: true, isError: false },
        ...state.CommentsData.filter((comment) => comment.mid !== payload),
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
        { ...s, is_verfied: false, isError: false },
        ...state.CommentsData.filter((comment) => comment.mid !== payload),
      ],
    };
  }
}
function ProductFooterSection({ product }: { product: ProductInterface }) {
  const sizes =
    product?.choice_options?.filter((s) => s.title == "Size")[0]?.options || [];
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
  const dispatchStore = useDispatch();
  const [sharedContacts, setShareContacts] = useState([]);

  const getData = async () => {
    let reqShares = await axios.get(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v2/elastic/shared_count/${product.id}`,
      {
        headers: {
          Authorization: `Bearer ${UserToken()}`,
        },
      }
    );
    dispatchStore({
      type: "shares",
      payload: reqShares.data.data.shared_count,
    });
    let req = await axios.get(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/product/likesCommentsSharesDetails/" +
        product.id,
      {
        headers: {
          Authorization: `Bearer ${UserToken()}`,
        },
      }
    );
    setProductData({
      ...productState.productDetails,
      comment_count: req.data.data.comments_count,
      comments: req.data.data.comments,
    });
    let arr = [];
    if (req.data.data.variation.length) {
      req.data.data.variation.map((s) => {
        let d = product.variation.filter((w) => w.type === s.type)[0];
        arr.push({ ...s, ...d });
      });
    }
    dispatchStore({
      type: "GET-PRODUCT-VARIATION",
      payload: {
        ...product,
        is_product_notify_for_user: req.data.data.is_product_notify_for_user,
        variation: arr,
      },
    });
    dispatchStore({ type: "STORE-VARIANTS", payload: req.data.data.variation });
  };
  useEffect(() => {
    getData();
  }, []);
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const currency = useSelector((state: any) => state.homepage.currency) || 1;
  const getPrice = (num) => {
    if (
      decimal_point_settings &&
      Object.keys(decimal_point_settings).includes("starting-setting")
    )
      return RoundPrice({
        num: num,
        rate: currency?.exchange_rate,
        points:
          decimal_point_settings["starting-setting"]?.decimal_point_settings ||
          0,
      });
  };
  const shareAction = () => {
    if (sharedContacts.length > 0) {
      const messageShare = {
        product_id: product.id,

        product_image_url: product.images[0],
        product_name: product.name,
        product_slug: product.slug,
        product_description: product?.details,
      };
      chat.ShareProduct({
        userId: sharedContacts,
        product: messageShare,
        callback: () => {
          setShareContacts([]);
          setOption("");
        },
      });
    } else {
      toast.warn(
        translate("please select one contact at least", GetAppLanguage())
      );
    }
  };
  return (
    <>
      {option === "AddToCart" && <SelectColor close={() => setOption("")} />}
      <div className="product-details-footer z-[999999999]">
        <ProductDetails />
        <ProductInfo
          currency={currency?.symbol}
          newPrice={getPrice(product.offer_price)}
          oldPrice={getPrice(product.price)}
        />
        {
          <ExtendedAreaInfo
            Render={productState?.Render}
            colors={product.sync_color_images}
            verifyCommentAction={(mid) =>
              dispatch({ type: "VerifyComment", payload: mid })
            }
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
          shareAction={() => shareAction()}
          productDetails={productState.productDetails}
          product={{
            name: product.name,
            selectedColor:
              product.sync_color_images?.length > 0
                ? product.sync_color_images[0]
                : [],
            selectedSize: sizes[0],
            id: product.id,
            ...product,
          }}
          share={sharedContacts.length > 0}
          activeOption={option}
          setOption={(e) => setOption(e)}
        />
      </div>
    </>
  );
}

export default ProductFooterSection;
