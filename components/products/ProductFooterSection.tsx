"use client";
import React, { useEffect, useReducer, useState } from "react";
import ProductInfo from "./ProductInfo";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import ProductDetails from "./ProductDetails";
import SelectColor from "./SelectColor";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAppLanguage,
  RoundPrice,
  translateFunction,
  UserID,
} from "utils/functions";

import { toast } from "react-toastify";
import chat from "services/chat";
import home from "services/home";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { useParams, useSearchParams } from "next/navigation";
import { LikesSharesCommentsApi, ProductViews, SharesCount } from "models/Api";
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
function ProductFooterSection({ product, currency }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const shareLoading = useSelector(
    (state: StateInterface) => state.details.shareLoading
  );
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
  const getComments = async () => {
    let req: LikesSharesCommentsApi = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/product/likesCommentsSharesDetails/" +
        product.slug,
      title: "Like & Comments Data Request",
    });
    setProductData({
      ...productState.productDetails,
      // @ts-ignore
      comment_count: req?.comments_count || 0,
      // @ts-ignore
      comments: req?.comments || [],
    });
  };
  const dispatchStore = useDispatch();
  const [sharedContacts, setShareContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const getData = async () => {
    // await home.CheckLogin();
    try {
      let req: LikesSharesCommentsApi = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/web/product/likesCommentsSharesDetails/" +
          product.slug,
        title: "Like & Comments Data Request",
      });

      dispatchStore({
        type: "STORE-VARIANTS",
        // @ts-ignore
        payload: {
          // @ts-ignore
          variation: req?.variation,
          // @ts-ignore
          slug_en_topic: req?.slug_en_topic,
        },
      });

      // @ts-ignore
      let likesNum = req?.count_of_likes || 0;
      // @ts-ignore
      let isLiked = req?.is_liked || 0;
      setProductData({
        ...productState.productDetails,
        // @ts-ignore
        comment_count: req?.comments_count || 0,
        // @ts-ignore
        comments: req?.comments || [],
      });
      let arr = [];
      // @ts-ignore
      if (req?.variation?.length) {
        req.variation.map((s) => {
          let d = product.variation.filter((w) => w.type === s.type)[0];
          arr.push({ ...s, ...d });
        });
      }
      const { color, size } = {
        color: searchParams.get("color"),
        size: searchParams.get("size"),
      };
      dispatchStore({
        type: "GET-PRODUCT-VARIATION",
        payload: {
          ...product,
          // @ts-ignore
          is_product_notify_for_user: req?.is_product_notify_for_user,
          variation: arr,
          likes: likesNum,
          is_liked: isLiked,
          color,
          size,
        },
      });
      setLoading(false);
      // @ts-ignore
      let reqShares: SharesCount = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v2/elastic/shared_count/${product.id}`,
        title: "Share Count Request",
      });

      dispatchStore({
        type: "shares",
        payload: reqShares.shared_count,
      });
      const viewsReq: ProductViews = await AxiosPost({
        url: process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + `/api/products/view`,
        title: "get Views For Product",
        body: {
          user_id: UserID(),
          product_id: product.id,
        },
      });
      dispatchStore({
        type: "VIEWS-PRODUCTS",
        payload: {
          views_count: viewsReq?.view_count || 0,
        },
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    dispatchStore({ type: "LOADED-CART", payload: false });

    getData();
  }, []);
  const decimal_point_settings = useSelector(
    (state: StateInterface) => state.homepage.settings
  ) || {
    "starting-setting": {
      decimal_point_settings: 0,
    },
  };

  let AddToCartOption = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption
  );
  const getPrice = (num) => {
    if (currency?.exchange_rate === null || !currency?.exchange_rate)
      return null;
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
      dispatchStore({ type: "share-loading", payload: true });
      chat.ShareProduct({
        userId: sharedContacts,
        product: messageShare,
        callback: () => {
          dispatchStore({ type: "share-loading", payload: false });
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
  const loginOpen = useSelector(
    (state: StateInterface) => state.homepage.loginOpen
  );

  return (
    <>
      {option === "AddToCart" && <SelectColor close={() => setOption("")} />}
      {!loginOpen && (
        <div className="product-details-footer z-[999999999]">
          <ProductDetails />
          <ProductInfo
            shipping={product?.shipping_cost || 0}
            currency={currency?.symbol}
            newPrice={
              AddToCartOption.price?.offer_price
                ? getPrice(AddToCartOption?.price?.offer_price)
                : getPrice(product?.offer_price)
            }
            oldPrice={
              AddToCartOption.price?.price
                ? getPrice(AddToCartOption?.price?.price)
                : getPrice(product.price)
            }
          />
          {
            <ExtendedAreaInfo
              loading={loading}
              getComments={async () => await getComments()}
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
            loading={loading}
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
            setOption={(e) => {
              if (option === e) setOption("");
              else setOption(e);
            }}
          />
        </div>
      )}
    </>
  );
}

export default ProductFooterSection;
