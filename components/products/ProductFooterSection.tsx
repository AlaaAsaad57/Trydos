"use client";
import React, { useEffect, useState } from "react";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { translateFunction } from "utils/functions";
import chat from "services/chat";
import { useParams, useSearchParams } from "next/navigation";
import auth from "services/auth";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { ProductFooterSectionPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { deleteCookie } from "utils/cookies/cookie-manager";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";

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
    editInfo,
    storeProduct,
    SelectedProduct,
  } = useAppStore();
  let { lang } = useParams();

  // @ts-ignore
  let [country, languageVariable] = lang.split("-");
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const sizes = product?.choice_options?.[0]?.options || [];

  const setProductData = (s) => {
    editInfo(s);
  };

  const VerifyComment = (mid) => {
    let { SelectedProduct: ProductData } = useAppStore.getState();
    let selected_comment = ProductData.fqa_questions.comments.find(
      (m) => m.mid === mid
    );

    editInfo({
      fqa_questions: {
        ...ProductData.fqa_questions,
        comments: [
          { ...selected_comment, is_verfied: false, isError: false },
          ...ProductData.fqa_questions.comments?.filter(
            (comment) => comment.mid !== mid
          ),
        ],
      },
    });
  };
  const ErrorAccure = (mid) => {
    let { SelectedProduct: ProductData } = useAppStore.getState();
    let selected_comment = ProductData.fqa_questions.comments.filter(
      (m) => m.mid === mid
    )[0];
    editInfo({
      fqa_questions: {
        ...ProductData.fqa_questions,
        comments: [
          { ...selected_comment, is_verfied: false, isError: true },
          ,
          ...ProductData.fqa_questions.comments?.filter(
            (comment) => comment.mid !== mid
          ),
        ],
      },
    });
  };

  const [option, setOption] = useState("");
  const getComments = async () => {
    try {
      let response: any = await fetchData({
        url: `/api/products/comments/fqa_comments?user_id=${auth.UserID()}&product_id=${
          product.id
        }`,
        reqTitle: REQUESTS_DATA.SOCIAL_INFO_REQUEST,
        method: "GET",
        server: "local",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      setProductData({
        ...SelectedProduct,
        // @ts-ignore
        comments_count: response.data?.total || 0,
        // @ts-ignore
        comments: response.data?.fqa_comments || [],
        fqa_questions: {
          comments: response.data?.fqa_comments || [],
          total: response.data?.total || 0,
          offset: response.data?.offset,
        },
      });
    } catch (err) {
      // Handle error as needed
    }
  };

  const [sharedContacts, setShareContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const getData = async () => {
    setProductData({
      ...SelectedProduct,
      fqa_questions: {
        comments: product.fqa_questions?.comments || [],
        total: product.fqa_questions?.total || 0,
        offset: product?.fqa_questions?.offset,
      },
    });
    // await home.CheckLogin();
    try {
      let [likesResponse, response_views] = await Promise.all([
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
            url: `/api/products/view`,
            reqTitle: REQUESTS_DATA.GET_VIEW_PRODUCT,
            method: "POST",
            server: "elastic",
            body: JSON.stringify({
              user_id: auth.UserID(),
              product_id: product.id,
            }),
            noMessage: true,
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
        color,
        size,
        views_count: response_views?.view_count || 0,
      });
      setLoading(false);
      // @ts-ignore

      setSharesCount(product.shared_count);
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
          user_id_custom: auth.UserID(),
          item_id: product?.id,
          item_name: product?.name,
          price: product.offer_price,
          brand: product?.brand?.name,
          brand_id: product?.brand?.id,
          category: product?.categories?.[0]?.name,
          category_id: product?.categories?.[0]?.id,
          count_likes: product?.count_of_likes,
          // review_count: response_views?.view_count,
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
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
    getData();
    disableAddToCartOption();
  }, []);
  const getImageForSharing = () => {
    const { color, size } = {
      color: searchParams.get("color"),
      size: searchParams.get("size"),
    };
    if (color && product?.sync_color_images) {
      return (
        product?.sync_color_images?.find(
          (s) => s.color_name === color || s.color_option === color
        )?.images?.[0]?.file_path ||
        product?.sync_color_images?.find(
          (s) => s.color_name === color || s.color_option === color
        )?.images?.[0]
      );
    } else {
      return product?.images?.[0]?.file_path || product?.images?.[0];
    }
  };
  const shareAction = () => {
    if (sharedContacts.length > 0) {
      const messageShare = {
        product_id: product.id,
        product_image_url: getImageForSharing(),
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
      fetch(
        `/api/editSocialProduct?pid=${product.id}&slug=${product.slug}&language=${languageVariable}&country=${country}`
      );
      GAevent({
        action: GA_EVENT_NAMES.SHARE_CONTENT,
        params: {
          content_id: product?.id,
          item_id: product?.id,
          item_name: product?.name,
          user_id_custom: auth.UserID(),
          brand_id: product?.brand?.id,
          category: product?.category?.name || product?.categories?.[0]?.name,
          category_id: product?.category?.id || product?.categories?.[0]?.id,
          brand: product?.brand?.name,
          price: product?.offer_price,
          share_context: "internal",
          shared_from_page: window.location.pathname,
          screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
          screen_path: window.location.pathname,
          method_share: "chat_in_share",
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
  useEffect(() => {
    editInfo({ ...product });
    storeProduct({ ...product, colorFrom: searchParams.get("color") });
  }, []);
  return (
    <>
      {!loginOpen && (
        <>
          {option.length > 0 && option !== "Like" && (
            <OverlayForClose
              close={() => {
                setOption("");
              }}
            />
          )}
          {
            <ExtendedAreaInfo
              getComments={async () => await getComments()}
              CommentsData={SelectedProduct?.fqa_questions?.comments ?? []}
              product={product}
              sharedContacts={sharedContacts}
              setShareContacts={(e) => setShareContacts(e)}
              active={option.length > 0 && option !== "Like"}
              option={option}
            />
          }

          <ProductOptions
            clearShare={() => setShareContacts([])}
            loading={loading}
            shareAction={() => shareAction()}
            productDetails={SelectedProduct}
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

const OverlayForClose = ({ close }) => {
  return (
    <div
      onClick={() => close()}
      className="absolute z-[99999999999] bottom-full bg-[rgba(0,0,0,0.2)] left-0 w-full h-screen"
      data-cy="close_extended_area"
    />
  );
};
