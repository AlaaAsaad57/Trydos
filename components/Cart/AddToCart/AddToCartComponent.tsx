"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  getCart,
  getConfiguredImage,
  translateFunction,
} from "utils/functions";
import { useAppStore } from "store";
import { useParams, useSearchParams } from "next/navigation";

import auth from "services/auth";
import home from "services/home";

import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GetImageUrl } from "utils/tinyUtils";
import { GAevent } from "utils/gtag";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import BottomSheet from "components/global/BottomSheet";
import Card from "./Card";
import ColorSelect from "./ColorSelect";
import SizeSelect from "./SizeSelect";
import PricesRow from "./PricesRow";
import ExtraInfoArea from "./ExtraInfoArea";
import { getCookie } from "utils/cookies/cookie-manager";
import AddToCartButton from "./Button";
import NotifyButton from "./NotifyButton";
import SearchParamUpdater from "components/global/ParamsUpdater";

function AddToCartComponent({ product, slug, close, enableCartAction }) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldShowRedeem = () => {
    if (!product.is_redeem) return false;
    let redeemed_products_ids = getCookie<any[]>("redemed_ids");
    if (redeemed_products_ids) {
      return !redeemed_products_ids.find(
        (s) => s.id === (product?.product_id ?? product?.id)
      );
    }
    return true;
  };
  const searchParams = useSearchParams();
  const [sizeFromUrl, colorFromUrl] = [
    searchParams.get("size"),
    searchParams.get("color"),
  ];

  const {
    localCart,
    currency,
    selected_product_for_add_to_cart,
    setSelectedProductForCart,
    initCart,
    expireRedeem,
    SelectedProduct,
  } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [, languageVariable] = lang?.split("-");
  const [ProductData, setProductData] = useState({
    ...product,
    is_redeem: product?.is_redeem && shouldShowRedeem(),
  });
  let selected_color =
    ProductData?.sync_color_images?.find(
      (s) =>
        s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
        s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase()
    ) || null;
  if (selected_color) {
    selected_color = {
      ...selected_color,
      color_option: selected_color?.color_option ?? selected_color?.color_name,
    };
  }
  if (ProductData?.sync_color_images?.length === 1) {
    selected_color = {
      ...ProductData?.sync_color_images?.[0],
      color_option:
        ProductData?.sync_color_images?.[0]?.color_option ??
        ProductData?.sync_color_images?.[0]?.color_name,
    };
  }
  const [selectedColor, setSelectedColor] = useState(selected_color);
  const [selectedSize, setSelectedSize] = useState(
    ProductData?.choice_options?.[0]?.options?.find(
      (option) => option.option === sizeFromUrl || option.name === sizeFromUrl
    ) || null
  );
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  useEffect(() => {
    if (product.shouldUpdate > 0) {
      getProductData();
    }
  }, [product?.shouldUpdate]);
  const GetLightData = async () => {
    try {
      setLoading(true);
      getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      let [data1, data2] = await Promise.all([
        (async () => {
          let response = await fetchData({
            url: `/web/product/qtyPriceDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VRIANTES,
            method: "GET",
            server: "market",
            signal: abortControllerRef.current?.signal,
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
        (async () => {
          let response = await fetchData({
            url: `/web/product/likesDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS_NOTIFICATIONS,
            method: "GET",
            server: "market",
            signal: abortControllerRef.current?.signal,
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
      ]);

      let variants_arr = data1.data.variation;
      let newVariants = data2.data.variation?.map((item) => {
        let d = variants_arr.find((s) => s.type === item.type);
        if (d)
          return {
            ...item,
            ...d,
          };
        else {
          return item;
        }
      });

      let tempProductData = {
        ...product,
        ...data1.data,
        is_redeem: data1.data.is_redeem && shouldShowRedeem(),
        // is_redeem: shouldShowRedeem() && true,
        ...data2.data,
        shared_count: product?.shared_count || 0,
        variation: newVariants,
        sync_color_images: !product.singleColor
          ? product.sync_color_images || []
          : [
              product?.sync_color_images?.find(
                (s) =>
                  s?.color_name === product?.sync_color_images?.[0]?.color_name
              ),
              ...product?.sync_color_images?.filter(
                (s) =>
                  s?.color_name !== product?.sync_color_images?.[0]?.color_name
              ),
            ],
      };

      if (abortControllerRef.current?.signal.aborted) return;
      setProductData(tempProductData);
      if (product?.singleColor) {
        // setSelectedColor(tempProductData?.sync_color_images[0]);
      } else if (colorFromUrl) {
        setSelectedColor(
          tempProductData?.sync_color_images?.find(
            (s) =>
              s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
              s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase()
          ) ?? tempProductData?.sync_color_images?.[0]
        );
      } else {
        // setSelectedColor(tempProductData?.sync_color_images[0]);
      }
      if (
        product &&
        (selected_product_for_add_to_cart?.id === tempProductData.id ||
          selected_product_for_add_to_cart?.product_id === tempProductData?.id)
      )
        setSelectedProductForCart({
          ...tempProductData,
          shouldUpdate: 0,
        });

      if (tempProductData?.choice_options?.[0]?.options?.length > 0) {
        if (sizeFromUrl?.length > 0) {
          setSelectedSize(
            tempProductData?.choice_options?.[0]?.options.find(
              (s) =>
                s.option?.toLowerCase() === sizeFromUrl?.toLowerCase() ||
                s.name?.toLowerCase() === sizeFromUrl?.toLowerCase()
            ) ?? tempProductData?.choice_options?.[0]?.options?.[0]
          );
        } else {
          // setSelectedSize(tempProductData?.choice_options?.[0]?.options?.[0]);
        }
      }
      // checkIfVariantEmpty();
      if (abortControllerRef.current?.signal.aborted) return;
      setLoading(false);
    } catch (err) {
      // Handle error as needed
      console.error(err);
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  };
  const getAllProductData = async () => {
    try {
      setLoading(true);
      getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      let [data1, data2, data3] = await Promise.all([
        (async () => {
          let response = await fetchData({
            url: `/web/product/qtyPriceDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VRIANTES,
            method: "GET",
            server: "market",
            signal: abortControllerRef.current?.signal,
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
        (async () => {
          let response = await fetchData({
            url: `/web/product/likesDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS_NOTIFICATIONS,
            method: "GET",
            server: "market",
            signal: abortControllerRef.current?.signal,
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
            signal: abortControllerRef.current?.signal,
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
      ]);

      let variants_arr = data1.data.variation;
      let newVariants = data2.data?.variation?.map((item) => {
        let d = variants_arr.find((s) => s.type === item.type);
        if (d)
          return {
            ...item,
            ...d,
          };
        else {
          return item;
        }
      });

      let tempProductData = {
        ...product,
        ...data1.data,
        is_redeem: data1.data.is_redeem && shouldShowRedeem(),
        // is_redeem: shouldShowRedeem() && true,
        ...data2.data,
        ...data3,
        shared_count: product?.shared_count || 0,
        variation: newVariants,
        sync_color_images: !product.singleColor
          ? product.sync_color_images || []
          : [
              product?.sync_color_images?.find(
                (s) =>
                  s?.color_name === product?.sync_color_images?.[0]?.color_name
              ),
              ...product?.sync_color_images?.filter(
                (s) =>
                  s?.color_name !== product?.sync_color_images?.[0]?.color_name
              ),
            ],
      };

      if (abortControllerRef.current?.signal.aborted) return;
      setProductData(tempProductData);
      if (product?.singleColor) {
        // setSelectedColor(tempProductData?.sync_color_images[0]);
      } else if (colorFromUrl) {
        setSelectedColor(
          tempProductData?.sync_color_images?.find(
            (s) =>
              s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
              s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase()
          ) ?? tempProductData?.sync_color_images?.[0]
        );
      } else {
        // setSelectedColor(tempProductData?.sync_color_images[0]);
      }
      if (
        product &&
        (selected_product_for_add_to_cart?.id === tempProductData.id ||
          selected_product_for_add_to_cart?.product_id === tempProductData?.id)
      )
        setSelectedProductForCart({
          ...tempProductData,
          shouldUpdate: 0,
        });

      if (tempProductData?.choice_options?.[0]?.options?.length > 0) {
        if (sizeFromUrl?.length > 0) {
          setSelectedSize(
            tempProductData?.choice_options?.[0]?.options.find(
              (s) =>
                s.option?.toLowerCase() === sizeFromUrl?.toLowerCase() ||
                s.name?.toLowerCase() === sizeFromUrl?.toLowerCase()
            ) ?? tempProductData?.choice_options?.[0]?.options?.[0]
          );
        } else {
          // setSelectedSize(tempProductData?.choice_options?.[0]?.options?.[0]);
        }
      }
      // checkIfVariantEmpty();
      if (abortControllerRef.current?.signal.aborted) return;
      setLoading(false);
    } catch (err) {
      // Handle error as needed
      console.error(err);
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  };
  const getProductData = async () => {
    if (product?.is_from_listing) {
      getAllProductData();
    } else {
      await GetLightData();
    }
  };

  const getSelectedItemCart = () => {
    if (ProductData?.variation?.length === 0)
      return localCart?.find((s) => s.id === ProductData.id);
    return localCart.find(
      (s) =>
        s.id === ProductData.id &&
        (s.color === selectedColor?.color_option ||
          s.color ===
            ProductData?.colors?.find(
              (cl) =>
                cl.option === selectedColor?.color_option ||
                cl.name === selectedColor?.selected_option
            )?.color) &&
        s.size === (selectedSize?.option ?? selectedSize)
    );
  };
  const getVariantSizeQty = (size) => {
    if (ProductData?.variation?.length > 0) {
      let selected_variant;
      if (
        ProductData?.sync_color_images?.length > 0 &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            `${selectedColor?.color_option}-${
              size?.option ?? size
            }`?.toLowerCase()
        );
      }
      if (
        ProductData?.sync_color_images?.length > 0 &&
        (!ProductData?.choice_options ||
          ProductData?.choice_options?.length === 0)
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            (selectedColor?.color_option ?? "")?.toLowerCase()
        );
      }
      if (
        (!ProductData?.sync_color_images ||
          ProductData?.sync_color_images?.length === 0) &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            (
              selectedSize?.option &&
              `${selectedSize?.option?.replace(" ", "")}`
            )?.toLowerCase()
        );
      }
      return {
        ...selected_variant,
        offer_price: selected_variant?.offer_price,
        ...(product?.showRedeemPrice
          ? {
              redeem_price:
                selected_variant?.redeem_price ?? product?.redeem_price,
            }
          : product?.flash_deal_end_date !== null
          ? {
              flash_deal_price: product?.offer_price,
            }
          : {}),
      };
    } else {
      // no variants
      return {
        type: "N/A",
        price: ProductData?.price,
        offer_price: ProductData?.offer_price,
        redeem_price: ProductData?.redeem_price,
        flash_deal_price: ProductData?.offer_price,
        qty: ProductData?.available_quantity,
        variant_notify_for_user: ProductData?.is_product_notify_for_user,
      };
    }
  };
  const IsValid = () => {
    let color_valid = false,
      size_valid = false;

    if (
      !ProductData?.sync_color_images ||
      ProductData?.sync_color_images?.length === 0
    )
      color_valid = true;
    else {
      color_valid = Boolean(selectedColor);
    }
    if (
      !ProductData?.choice_options ||
      ProductData?.choice_options?.length === 0
    )
      size_valid = true;
    else {
      size_valid = Boolean(selectedSize);
    }
    return color_valid && size_valid;
  };
  const getSelectedVariantQty = () => {
    if (!IsValid())
      return {
        type: "N/A",
        price: ProductData?.price,
        offer_price: ProductData?.offer_price,
        redeem_price: ProductData?.redeem_price,
        flash_deal_price: ProductData?.offer_price,
        qty: ProductData?.available_quantity,
        variant_notify_for_user: ProductData?.is_product_notify_for_user,
      };
    if (ProductData?.variation?.length > 0) {
      let selected_variant;
      if (
        ProductData?.sync_color_images?.length > 0 &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            `${selectedColor?.color_option}-${
              selectedSize?.option ?? selectedSize
            }`?.toLowerCase()
        );
      }
      if (
        ProductData?.sync_color_images?.length > 0 &&
        (!ProductData?.choice_options ||
          ProductData?.choice_options?.length === 0)
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            (selectedColor?.color_option ?? "")?.toLowerCase()
        );
      }
      if (
        (!ProductData?.sync_color_images ||
          ProductData?.sync_color_images?.length === 0) &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            (
              selectedSize?.option &&
              `${selectedSize?.option?.replace(" ", "")}`
            )?.toLowerCase()
        );
      }
      return {
        ...selected_variant,
        offer_price: selected_variant?.offer_price,
        ...(product?.showRedeemPrice
          ? {
              redeem_price:
                selected_variant?.redeem_price ?? product?.redeem_price,
            }
          : product?.flash_deal_end_date !== null
          ? {
              flash_deal_price: product?.offer_price,
            }
          : {}),
      };
    } else {
      // no variants
      return {
        type: "N/A",
        price: ProductData?.price,
        offer_price: ProductData?.offer_price,
        redeem_price: ProductData?.redeem_price,
        flash_deal_price: ProductData?.offer_price,
        qty: ProductData?.available_quantity,
        variant_notify_for_user: ProductData?.is_product_notify_for_user,
      };
    }
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    if (
      document.querySelector<HTMLElement>(".alternate-product-details-footer")
    )
      document.querySelector<HTMLElement>(
        ".alternate-product-details-footer"
      ).style.display = "none";
    getProductData();
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (
        document.querySelector<HTMLElement>(".alternate-product-details-footer")
      )
        document.querySelector<HTMLElement>(
          ".alternate-product-details-footer"
        ).style.display = "flex";
    };
  }, []);

  const shouldShowNotifyButton = () => {
    let bool = false;
    if (ProductData?.variation?.length > 0) {
      bool =
        ProductData?.variation?.filter((s) => s.qty === 0).length ===
        ProductData?.variation?.length;
    } else {
      bool = ProductData.available_quantity === 0;
    }

    //restricted,status,collect_after_ordering,quantity,allVarIsEmpty
    if (ProductData?.is_active === false || ProductData.is_country_restricted)
      return true;
    if (ProductData.collected_after_ordering === 1) return false;
    if (getSelectedVariantQty()?.qty === 0) return true;
    return bool;
  };
  const updateQuantityRemotley = async () => {
    let response = await fetchData({
      method: "GET",
      server: "market",
      url: `/web/product/qtyPriceDetails/${slug}`,
      useCached: false,
      reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS,
      signal: abortControllerRef.current?.signal,
    });

    if (abortControllerRef.current?.signal.aborted) return;
    setProductData({
      ...ProductData,
      ...response.data,
      variation: response.data.variation?.map((variant) => {
        return {
          ...variant,
          notify_for_user: ProductData?.variation?.find(
            (s) => s.type === variant.type
          )?.notify_for_user,
        };
      }),
      is_redeem: response?.data?.is_redeem && shouldShowRedeem(),
    });
  };
  const updateQuantityLocally = (type, operation) => {
    let response = ProductData;
    setProductData({
      ...ProductData,
      variation: response?.variation?.map((s) => {
        if (s.type !== type) {
          return s;
        } else {
          return {
            ...s,
            qty: operation === "add" ? s.qty - 1 : s.qty + 1,
            notify_for_user: ProductData?.variation?.find(
              (s) => s.type === type
            )?.notify_for_user,
          };
        }
      }),
      available_quantity:
        operation === "add"
          ? response.available_quantity - 1
          : response.available_quantity + 1,
      is_redeem: response?.is_redeem && shouldShowRedeem(),
    });
  };
  const updateQuantity = async ({ isLocal = true, type, operation }) => {
    if (isLocal) updateQuantityLocally(type, operation);
    else await updateQuantityRemotley();
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  return (
    <BottomSheet
      fromProductPage={product?.fromProductPage}
      noPadding={true}
      isOpen={true}
      onClose={() => {
        setSelectedProductForCart(null);
      }}
      height={75}
    >
      <SearchParamUpdater searchKey="addToCart" searchValue={product?.slug} />
      <div
        className={`${
          isRtl ? "items-end" : "items-start"
        } flex flex-col   w-full max-h-[75vh] h-full pt-[32px] overflow-y-auto pb-[213px]`}
      >
        <Card
          brandImabge={GetImageUrl(
            getConfiguredImage({ src: ProductData?.brand?.icon, height: 15 })
          )}
          image={getConfiguredImage({
            src:
              (selectedColor?.images?.[0]?.file_path &&
                GetImageUrl(selectedColor?.images?.[0]?.file_path)) ||
              (ProductData?.sync_color_images?.[0]?.images?.[0] &&
                GetImageUrl(
                  ProductData?.sync_color_images?.[0]?.images?.[0]?.file_path
                )) ||
              GetImageUrl(selectedColor?.images?.[0]) ||
              (ProductData?.images?.[0]?.file_path &&
                GetImageUrl(ProductData?.images?.[0]?.file_path)) ||
              GetImageUrl(ProductData?.images?.[0]),
            width: 400,
            height: 400,
          })}
          name={ProductData?.name}
          offer_price={
            getSelectedItemCart()?.is_redeem
              ? getSelectedItemCart()?.offer_price
              : getSelectedVariantQty()?.offer_price
          }
          price={getSelectedVariantQty()?.price}
          redeem_price={
            shouldShowRedeem() && getSelectedVariantQty()?.redeem_price
          }
          shippingDays={ProductData?.shipping_days}
          shouldShowOrangeBorder={
            ProductData.is_redeem ||
            ProductData?.flash_deal_details ||
            ProductData?.flash_deal_end_date
          }
        />
        {ProductData?.sync_color_images?.length > 0 && (
          <ColorSelect
            // colors={ProductData?.sync_color_images}
            colors={ProductData?.sync_color_images?.filter((s) =>
              ProductData.colors?.find(
                (color) =>
                  color.option === s.color_option || color.name === s.color_name
              )
            )}
            selectedColor={selectedColor}
            setSelectedColor={(e) => {
              GAevent({
                action: GA_EVENT_NAMES.CHANGE_COLOR,
                params: {
                  user_id_custom: auth.UserID(),
                  item_id: ProductData.id,
                  item_name: ProductData?.name,
                  brand: ProductData?.brand?.name,
                  brand_id: ProductData?.brand?.id,
                  category:
                    ProductData?.category?.name ||
                    ProductData?.categories?.[0]?.name,
                  category_id:
                    ProductData?.category?.id ||
                    ProductData?.categories?.[0]?.id,
                  price: ProductData?.offer_price,
                  selected_color: e?.color_option || e?.color_name,
                  selected_size: selectedSize?.option ?? selectedSize?.name,
                },
              });
              setSelectedColor(e);
            }}
          />
        )}
        {ProductData?.choice_options?.[0]?.options?.length > 0 && (
          <SizeSelect
            isCollectAfterOrder={ProductData.collected_after_ordering === 1}
            isSizeNotified={(e) =>
              getVariantSizeQty(e)?.variant_notify_for_user
            }
            qty={getSelectedVariantQty()?.qty}
            sizeQty={(e) => {
              return getVariantSizeQty(e)?.qty;
            }}
            selectedSize={selectedSize}
            setSelectedSize={(e) => {
              GAevent({
                action: GA_EVENT_NAMES.CHANGE_SIZE,
                params: {
                  user_id_custom: auth.UserID(),
                  item_id: ProductData.id,
                  item_name: ProductData?.name,
                  brand: ProductData?.brand?.name,
                  brand_id: ProductData?.brand?.id,
                  category:
                    ProductData?.category?.name ||
                    ProductData?.categories?.[0]?.name,
                  category_id:
                    ProductData?.category?.id ||
                    ProductData?.categories?.[0]?.id,
                  price: ProductData?.offer_price,
                  selected_color:
                    selectedColor?.color_option ?? selectedColor?.color_name,
                  selected_size: e?.option ?? e?.name ?? e,
                },
              });
              setSelectedSize(e);
            }}
            sizes={ProductData?.choice_options?.[0]?.options}
          />
        )}
      </div>
      <div
        style={{
          border: "1px solid rgb(255,98.0.0.5)",
        }}
        className=" flex pb-[18px] flex-col w-full min-h-[136px] rounded-t-[30px] gap-[8px] h-auto fixed bottom-0 bg-[#FFFFFF] shadow-[0px_-3px_20px_rgb(0,0,0,0.1)] z-50"
      >
        <PricesRow
          is_redeem={product.is_redeem}
          currency={currency}
          language={languageVariable}
          offer_price={
            getSelectedItemCart()?.is_redeem
              ? getSelectedItemCart()?.offer_price
              : getSelectedVariantQty()?.offer_price
          }
          price={getSelectedVariantQty()?.price}
          id={ProductData?.id}
          redeem_price={
            shouldShowRedeem() &&
            ProductData?.is_redeem &&
            getSelectedVariantQty()?.redeem_price
          }
          shipping_cost={product?.shipping_cost}
        />
        <ExtraInfoArea
          isCollectAfterOrder={ProductData.collected_after_ordering === 1}
          redeem_price={getSelectedVariantQty()?.redeem_price}
          selected_color={selectedColor}
          selected_size={selectedSize}
          isQtyEmpty={getSelectedVariantQty()?.qty === 0}
          isRedeem={ProductData?.is_redeem && shouldShowRedeem()}
          flashDeal={ProductData?.flash_deal_end_date}
          id={ProductData?.id}
          RedemEnd={() => {
            if (SelectedProduct?.id === product.id) {
              expireRedeem();
            }
            setProductData({ ...ProductData, is_redeem: false });
          }}
          isInCart={localCart?.find((s) => s.id === ProductData?.id)}
        />
        {shouldShowNotifyButton() ? (
          <NotifyCartButton
            setNotify={() => {
              setProductData({
                ...ProductData,
                variation: ProductData?.variation?.map((s) => {
                  if (s.type === getSelectedVariantQty()?.type) {
                    return { ...s, variant_notify_for_user: true };
                  }
                  return s;
                }),
                is_product_notify_for_user:
                  !ProductData?.variation ||
                  ProductData?.variation?.length === 0
                    ? true
                    : ProductData?.is_product_notify_for_user,
              });
            }}
            id={ProductData?.id}
            isNotified={getSelectedVariantQty()?.variant_notify_for_user}
            product={ProductData}
            selected_variant={getSelectedVariantQty()?.type}
            initialLoading={loading && product?.is_from_listing}
          />
        ) : (
          <AddToCartButton
            fullQty={localCart.filter((s) => s.id === product?.id)?.length}
            colors={ProductData?.sync_color_images}
            sizes={ProductData?.choice_options?.[0]?.options}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            product={ProductData}
            initialLoading={loading && product?.is_from_listing}
            id={ProductData?.id}
            updateQuantity={async (isLocal, type = null, operation) => {
              if (ProductData.collected_after_ordering === 0)
                await updateQuantity({ isLocal, type, operation });
            }}
            loading={requestLoading}
            setLoading={setRequestLoading}
            selectedVariant={getSelectedVariantQty()}
          />
        )}
      </div>
    </BottomSheet>
  );
}

export default AddToCartComponent;

const NotifyCartButton = ({
  isNotified,
  setNotify,
  selected_variant,
  id,
  product,
  initialLoading,
}) => {
  const NotifyAction = async () => {
    try {
      let permission = null;
      if (typeof Notification !== "undefined") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        showErrorNotification(
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access"
          )
        );
        return;
      }
      if (!isNotified) {
        GAevent({
          action: GA_EVENT_NAMES.ENABLE_PRODUCT_NOTIFICATION,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product.id,
            type_notification: "product_availablity",
            item_name: product?.name,
            brand: product?.brand?.name,
            brand_id: product?.brand?.id,
            category: product?.category?.name || product?.categories?.[0]?.name,
            category_id: product?.category?.id || product?.categories?.[0]?.id,
            price: product?.offer_price,
          },
        });
        setNotify();
        await home.RequestFireBase();
        await auth.NotifyForProducts({
          id: id,
          variant: selected_variant,
        });
        await home.GetFireBaseSettings();
      } else {
        showSuccessNotification(
          translateFunction("You will be notified for this product already"),
          5000
        );
      }
    } catch (error) {
      showErrorNotification(
        error ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access"
          )
      );
      console.log(error);
    }
  };
  return (
    <NotifyButton
      isNotified={isNotified}
      loading={initialLoading}
      notifyAction={() => {
        NotifyAction();
      }}
    />
  );
};
