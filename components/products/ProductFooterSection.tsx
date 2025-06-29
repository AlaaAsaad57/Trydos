"use client";
import React, { useEffect, useReducer, useState } from "react";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { translateFunction } from "utils/functions";
import chat from "services/chat";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { useParams, useSearchParams } from "next/navigation";
import { ProductSocialInfo } from "models/API/market/ProductSocialInfo";
import { ProductViews } from "models/API/elastic/ProductViews";
import { SharesCount } from "models/API/market/ProductSharesCount";
import auth from "services/auth";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { dispatchRouteChangeEvent } from "utils/events";
import { ProductFooterSectionPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";

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
function ProductFooterSection({
  product,
  currency,
}: ProductFooterSectionPropsType) {
  const {
    setLoadedCart,
    getProductVariation,
    setViewsProducts,
    storeVariants,
    disableAddToCartOption,
    setShareLoading,
    setSharesCount,
    loginOpen,
  } = useAppStore();
  let { lang } = useParams();

  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
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
    let response: { data: ProductSocialInfo } = await fetchData({
      url: "/web/product/likesCommentsSharesDetails/" + product.slug,
      reqTitle: "Social Info Request",
      method: "GET",
      server: "market",
    });
    setProductData({
      ...productState.productDetails,
      // @ts-ignore
      comment_count: response.data?.comments_count || 0,
      // @ts-ignore
      comments: response.data?.comments || [],
    });
  };

  const [sharedContacts, setShareContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const getData = async () => {
    // await home.CheckLogin();
    try {
      let response: { data: ProductSocialInfo } = await fetchData({
        url: "/web/product/likesCommentsSharesDetails/" + product.slug,
        reqTitle: "Like & Comments Data Request",
        method: "GET",
        server: "market",
      });
      storeVariants({
        // @ts-ignore
        variation: response.data?.variation,
        // @ts-ignore
        slug_en_topic: response.data?.slug_en_topic,
      });
      // @ts-ignore
      let likesNum = response.data?.count_of_likes || 0;
      // @ts-ignore
      let isLiked = response.data?.is_liked || 0;
      setProductData({
        ...productState.productDetails,
        // @ts-ignore
        comment_count: response.data?.comments_count || 0,
        // @ts-ignore
        comments: response.data?.comments || [],
      });
      let arr = [];
      // @ts-ignore
      if (response.data?.variation?.length) {
        response.data.variation.map((s) => {
          let d = product.variation.filter((w) => w.type === s.type)[0];
          arr.push({ ...s, ...d });
        });
      }
      const { color, size } = {
        color: searchParams.get("color"),
        size: searchParams.get("size"),
      };

      getProductVariation({
        ...product,
        // @ts-ignore
        is_product_notify_for_user: response.data?.is_product_notify_for_user,
        variation: arr,
        likes: likesNum,
        is_liked: isLiked,
        color,
        size,
      });
      setLoading(false);
      // @ts-ignore
      let response_shares: { data: SharesCount } = await fetchData({
        url: `/api/v2/elastic/shared_count/${product.id}`,
        reqTitle: "Share Count Request",
        server: "chat",
        method: "GET",
      });
      setSharesCount(response_shares.data.shared_count);
      const viewsReq: ProductViews = await AxiosPost({
        url: `/api/products/view`,
        title: "get Views For Product",
        body: {
          user_id: auth.UserID(),
          product_id: product.id,
        },
      });
      setViewsProducts({
        views_count: viewsReq?.view_count || 0,
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoadedCart(false);
    dispatchRouteChangeEvent("completed");
    getData();
    disableAddToCartOption();
  }, []);

  const shareAction = () => {
    if (sharedContacts.length > 0) {
      const messageShare = {
        product_id: product.id,

        product_image_url: product.images[0],
        product_name: product.name,
        product_slug: product.slug,
        product_description: product?.details,
      };
      setShareLoading(true);
      chat.ShareProduct({
        userId: sharedContacts,
        product: messageShare,
        callback: () => {
          setShareLoading(false);
          setShareContacts([]);
          setOption("");
        },
      });
    } else {
      showErrorNotification(
        translate(
          "please select one contact at least",
          LocalizationServiceClass.GetAppLanguage()
        )
      );
    }
  };
  return (
    <>
      {!loginOpen && (
        <>
          {
            <ExtendedAreaInfo
              setOption={(e) => {
                setOption(e);
              }}
              getComments={async () => await getComments()}
              Render={productState?.Render}
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
        </>
      )}
    </>
  );
}

export default ProductFooterSection;
