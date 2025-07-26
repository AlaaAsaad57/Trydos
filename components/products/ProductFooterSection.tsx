"use client";
import React, { Suspense, useEffect, useReducer, useState } from "react";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { RoundPrice, translateFunction } from "utils/functions";
import chat from "services/chat";
import { useParams, useSearchParams } from "next/navigation";
import { ProductSocialInfo } from "models/API/market/ProductSocialInfo";
import auth from "services/auth";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { dispatchRouteChangeEvent } from "utils/events";
import { ProductFooterSectionPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import ProductRedeemButton from "./ProductRedeemPrice";
import { deleteCookie, getCookie } from "utils/cookies/cookie-manager";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";

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
    try {
      let response: { data: ProductSocialInfo } = await fetchData({
        url: "/web/product/CommentsSharesDetails/" + product.slug,
        reqTitle: REQUESTS_DATA.SOCIAL_INFO_REQUEST,
        method: "GET",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      setProductData({
        ...productState.productDetails,
        // @ts-ignore
        comment_count: response.data?.comments_count || 0,
        // @ts-ignore
        comments: response.data?.comments || [],
      });
    } catch (err) {
      // Handle error as needed
    }
  };

  const [sharedContacts, setShareContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const getData = async () => {
    // await home.CheckLogin();
    try {
      let [likesResponse, commentsResponse, response_shares, response_views] =
        await Promise.all([
          (async () => {
            let response = await fetchData({
              url: "/web/product/likesDetails/" + product.slug,
              reqTitle: REQUESTS_DATA["LIKE_&_COMMENTS_DATA_REQUEST"],
              method: "GET",
              server: "market",
            });
            // @ts-ignore
            if (!response.success) {
              throw new Error(response.message);
            }
            return response;
          })(),
          (async () => {
            let response = await fetchData({
              url: "/web/product/CommentsSharesDetails/" + product.slug,
              reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
              method: "GET",
              server: "market",
            });
            // @ts-ignore
            if (!response.success) {
              throw new Error(response.message);
            }
            return response;
          })(),
          (async () => {
            let response = await fetchData({
              url: `/api/v2/elastic/shared_count/${product.id}`,
              reqTitle: REQUESTS_DATA.SHARE_COUNT_REQUEST,
              server: "chat",
              method: "GET",
            });
            // @ts-ignore
            if (!response.success) {
              throw new Error(response.message);
            }
            return response;
          })(),
          (async () => {
            let response = await fetchData({
              url: `/api/products/view`,
              reqTitle: REQUESTS_DATA.GET_VIEW_PRODUCT,
              method: "POST",
              server: "elastic",
              body: JSON.stringify({
                user_id: auth.UserID(),
                product_id: product.id,
              }),
            });
            // @ts-ignore
            if (!response.success) {
              throw new Error(response.message);
            }
            return response;
          })(),
        ]);
      storeVariants({
        // @ts-ignore
        variation: likesResponse.data?.variation,
        // @ts-ignore
        slug_en_topic: likesResponse.data?.slug_en_topic,
      });
      // @ts-ignore
      let likesNum = likesResponse.data?.count_of_likes || 0;
      // @ts-ignore
      let isLiked = likesResponse.data?.is_liked || 0;
      setProductData({
        ...productState.productDetails,
        // @ts-ignore
        comment_count: commentsResponse.data?.comments_count || 0,
        // @ts-ignore
        comments: commentsResponse.data?.comments || [],
      });
      let arr = [];
      // @ts-ignore
      if (likesResponse.data?.variation?.length) {
        likesResponse.data.variation.map((s) => {
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
        is_product_notify_for_user:
          likesResponse.data?.is_product_notify_for_user,
        variation: arr,
        likes: likesNum,
        is_liked: isLiked,
        color,
        size,
        sharesCount: response_shares.data.shared_count,
      });
      setLoading(false);
      // @ts-ignore

      setSharesCount(response_shares.data.shared_count);

      setViewsProducts({
        views_count: response_views?.view_count || 0,
      });
      const lastPage = localStorage.getItem("last-page");
      let lastPageData;
      if (lastPage) {
        lastPageData = JSON.parse(lastPage);
      }
      GAevent({
        action: GA_EVENT_NAMES.VIEW_PRODUCT_EVENT,
        params: {
          user_ID: auth.UserID(),
          item_id: product?.sku || product?.slug,
          item_name: product?.name,
          price: RoundPrice({
            num: product.offer_price,
            rate: currency?.exchange_rate,
            returnNumber: true,
          }),
          brand: product?.brand?.name,
          brand_id: product?.brand?.id,
          category: product?.category?.name,
          category_id: product?.category?.id,
          count_likes: likesNum,
          review_counts: response_views?.view_count,
          interaction_type: "view",
          screen_name: lastPageData?.screen || "link",
          screen_path: lastPageData?.url || window.location.pathname,
        },
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    deleteCookie("counter");
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
          {product?.is_redeem && <ProductRedeemButton product={product} />}
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
