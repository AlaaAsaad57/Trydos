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
import { getCookie, setCookie } from "utils/cookies/cookie-manager";
import AddToCartButton from "./Button";
import NotifyButton from "./NotifyButton";
import SearchParamUpdater from "components/global/ParamsUpdater";
import { showErrorMessage } from "components/global/AddToCartMessage";
const normalizeSize = (s) => {
  if (typeof s === "string") return s.replace(/_/g, "-");
  else return s;
};
import { getProductDataForAddToCart } from "serverRequests";

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
  const [country, languageVariable] = lang?.split("-");
  const [ProductData, setProductData] = useState({
    ...product,
    is_redeem: shouldShowRedeem(),
  });
  const configureRedeemedProducts = (id) => {
    let redeemed_products_ids = getCookie<any>("redemed_ids");

    if (redeemed_products_ids) {
      let parsed_redeemed_products_ids = redeemed_products_ids
        ? redeemed_products_ids
        : [];
      if (!parsed_redeemed_products_ids?.find((s) => s.id === id)) {
        let MAX_ARRAY_LENGTH =
          parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH) || 5;
        if (parsed_redeemed_products_ids.length < MAX_ARRAY_LENGTH)
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids,
            { id: id, showingDate: new Date().toISOString() },
          ]);
        else
          setCookie("redemed_ids", [
            ...parsed_redeemed_products_ids.slice(1, MAX_ARRAY_LENGTH),
            { id: id, showingDate: new Date().toISOString() },
          ]);
      } else {
        return;
      }
    } else {
      setCookie("redemed_ids", [
        { id: id, showingDate: new Date().toISOString() },
      ]);
    }
  };
  // console.log(ProductData?.seconds);
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
    ) ||
      ProductData?.choice_options?.[0]?.options?.[0] ||
      null
  );
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  function resolveVariant({
    colors = [],
    sizes = [],
    selectedColor = null,
    selectedSize = null,
    variations = [],
    isForCollect = false,
  }) {
    if (isForCollect) {
      let result: any = {};
      if (colors && colors?.length > 0) {
        result = {
          ...result,
          color: colors?.[0]?.color_option ?? colors?.[0]?.option,
        };
      }
      if (sizes && sizes?.length > 0) {
        result = { ...result, size: sizes?.[0]?.option ?? sizes?.[0] };
      }
      return result;
    }
    try {
      if (!Array.isArray(variations) || variations.length === 0) {
        return { variant: null, color: null, size: null };
      }

      // ---------------- normalization ----------------

      const normalize = (v) => {
        if (!v) return null;
        if (typeof v === "string") return v;
        return v.option || v.color_option || null;
      };

      const selColor = normalize(selectedColor);
      const selSize = normalize(selectedSize);

      const colorSet = new Set(colors.map((c) => c.color_option));
      const sizeSet = new Set(sizes.map((s) => s.option));

      // ---------------- variant parser ----------------

      function parseVariantType(type) {
        const parts = type.split("-");
        let color = null;
        let size = null;

        for (const part of parts) {
          if (colorSet.has(part)) color = part;
          else if (sizeSet.has(part)) size = part;
        }

        return { color, size };
      }

      const inStock = (v) => v.qty > 0;

      // ---------------- exact match ----------------

      const exact = variations.find((v) => {
        const { color, size } = parseVariantType(v.type);
        return (
          (!selColor || color === selColor) && (!selSize || size === selSize)
        );
      });

      if (exact && inStock(exact)) {
        const { color, size } = parseVariantType(exact.type);
        return { variant: exact, color, size };
      }

      // ---------------- ranked matching ----------------

      function rankVariants(source) {
        return source
          .map((v) => {
            const { color, size } = parseVariantType(v.type);

            let score = 0;
            if (selColor && color === selColor) score += 2;
            if (selSize && size === selSize) score += 1;

            return { v, color, size, score };
          })
          .sort((a, b) => b.score - a.score);
      }

      const inStockVariants = variations.filter(inStock);

      // ---------------- fallback logic ----------------

      // 1) Prefer in-stock variants
      if (inStockVariants.length > 0) {
        const ranked = rankVariants(inStockVariants);
        const best = ranked[0];
        return {
          variant: best.v,
          color: best.color,
          size: best.size,
        };
      }

      // 2) Everything is out of stock → ignore qty
      const rankedAll = rankVariants(variations);
      const best = rankedAll[0];

      return {
        variant: best.v,
        color: best.color,
        size: best.size,
      };
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (product.shouldUpdate > 0) {
      getProductData();
    }
  }, [product?.shouldUpdate]);

  const getAllProductData = async () => {
    try {
      setLoading(true);
      getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      let data = await getProductDataForAddToCart({
        language: languageVariable,
        country: country,
        slug: slug,
      });

      let tempProductData = {
        ...product,
        ...data,
        is_redeem: data.is_redeem && shouldShowRedeem(),
        shared_count: 0,
        sync_color_images: !product.singleColor
          ? data.sync_color_images || product?.sync_color_images || []
          : [
              (data?.sync_color_images ?? product?.sync_color_images)?.find(
                (s) =>
                  s?.color_name === data?.sync_color_images?.[0]?.color_name
              ),
              ...(
                data?.sync_color_images ?? product?.sync_color_images
              )?.filter(
                (s) =>
                  s?.color_name !== data?.sync_color_images?.[0]?.color_name
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
            )?.option ??
              tempProductData?.choice_options?.[0]?.options?.[0]?.option
          );
        } else {
          // setSelectedSize(tempProductData?.choice_options?.[0]?.options?.[0]);
        }
      }
      // checkIfVariantEmpty();

      if (abortControllerRef.current?.signal.aborted) return;
      setLoading(false);

      return tempProductData;
    } catch (err) {
      // Handle error as needed
      console.error(err);
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  };
  const getProductData = async () => {
    let tempProductData;
    tempProductData = await getAllProductData();
    return tempProductData;
  };

  const getSelectedItemCart = () => {
    const hasColorVariants = ProductData?.sync_color_images?.length > 0;
    const hasSizeVariants =
      ProductData?.choice_options?.[0]?.options?.length > 0;

    // Case 1: No variants at all (no color, no size)
    if (!hasColorVariants && !hasSizeVariants) {
      return localCart?.find((s) => s.id === ProductData.id);
    }

    // Case 2: Has color AND size variants
    if (hasColorVariants && hasSizeVariants) {
      return localCart.find(
        (s) =>
          s.id === ProductData.id &&
          (s.color === selectedColor?.color_option ||
            s?.color === selectedColor?.color_name ||
            s?.color ===
              ProductData?.colors?.find(
                (cl) =>
                  cl?.option === selectedColor?.color_option ||
                  cl?.name === selectedColor?.color_name
              )?.color) &&
          (s?.size === selectedSize?.option ||
            s.size === selectedSize?.name ||
            s.size === selectedSize)
      );
    }

    // Case 3: Has color only (no size)
    if (hasColorVariants && !hasSizeVariants) {
      return localCart.find(
        (s) =>
          s?.id === ProductData?.id &&
          (s?.color === selectedColor?.color_option ||
            s?.color === selectedColor?.color_name ||
            s?.color ===
              ProductData?.colors?.find(
                (cl) =>
                  cl.option === selectedColor?.color_option ||
                  cl.name === selectedColor?.color_name
              )?.color)
      );
    }

    // Case 4: Has size only (no color)
    if (!hasColorVariants && hasSizeVariants) {
      return localCart?.find(
        (s) =>
          s?.id === ProductData.id &&
          (s?.size === selectedSize?.option ||
            s.size === selectedSize?.name ||
            s.size === selectedSize)
      );
    }

    // Fallback
    return localCart?.find((s) => s.id === ProductData?.id);
  };

  const reachedMaxQty = () => {
    let selectedItem = getSelectedItemCart();

    if (!selectedItem) return false;
    if (Number(product?.max_allowed_qty) === 0) return false;
    return selectedItem.quantity >= Number(product?.max_allowed_qty);
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
              size && `${(size?.option ?? size)?.replace(" ", "")}`
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
              selectedSize &&
              `${(selectedSize?.option ?? selectedSize)?.replace(" ", "")}`
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

  const initializeUI = async () => {
    try {
      let tempProductData = await getProductData();
      let res = resolveVariant({
        colors: tempProductData.sync_color_images,
        isForCollect: tempProductData?.collected_after_ordering === 1,
        variations: tempProductData?.variation,
        sizes: tempProductData?.choice_options?.[0]?.options,
        selectedColor:
          selectedColor ??
          product?.sync_color_images?.find(
            (s) => s?.color_name === product?.sync_color_images?.[0]?.color_name
          ),
        selectedSize:
          selectedSize ?? tempProductData?.choice_options?.[0]?.options?.[0],
      });
      setSelectedProductForCart({
        ...selected_product_for_add_to_cart,
        done: true,
      });
      if (res.color) {
        setSelectedColor(
          tempProductData?.sync_color_images?.find(
            (s) =>
              s?.option === res?.color ||
              s?.name === res.color ||
              s?.color_option === res.color
          )
        );
      }
      if (res.size) {
        setSelectedSize(
          tempProductData?.choice_options?.[0]?.options?.find(
            (s) => s.option === res.size || s.name === res.size
          )?.option
        );
      }
    } catch (error) {}
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    if (
      document.querySelector<HTMLElement>(".alternate-product-details-footer")
    )
      document.querySelector<HTMLElement>(
        ".alternate-product-details-footer"
      ).style.display = "none";
    initializeUI();
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
  const GetFinalPriceOfProduct = () => {
    if (ProductData?.is_redeem && shouldShowRedeem()) {
      return ProductData?.redeem_price;
    }
    return ProductData?.offer_price;
  };
  const IsColorHasDiscount = (colorVariant) => {
    if (!colorVariant) return false;
    if (ProductData?.choice_options?.length > 0 && !selectedSize) return false;
    const variant = ProductData?.variation?.find((s) => {
      if (ProductData?.choice_options?.length > 0 && selectedSize) {
        return (
          s?.type
            ?.toLowerCase()
            ?.startsWith(
              colorVariant?.color_option?.toLowerCase() ||
                s?.type.toLowerCase() ===
                  colorVariant?.color_name?.toLowerCase()
            ) &&
          s?.type
            .toLowerCase()
            .endsWith(
              `-${(selectedSize?.option ?? selectedSize)
                ?.toString()
                .toLowerCase()}`
            )
        );
      } else {
        return s?.type
          ?.toLowerCase()
          ?.startsWith(
            colorVariant?.color_option?.toLowerCase() ||
              s?.type.toLowerCase() === colorVariant?.color_name?.toLowerCase()
          );
      }
    });
    if (!variant) return false;
    if (ProductData?.is_redeem && shouldShowRedeem()) {
      // if(variant?.redeem_price < ProductData?.redeem_price)
      return Math.round(
        ((GetFinalPriceOfProduct() - variant?.redeem_price) * 100) /
          GetFinalPriceOfProduct()
      );
    } else {
      // if(variant?.offer_price < ProductData?.offer_price)
      return Math.round(
        ((GetFinalPriceOfProduct() - variant?.offer_price) * 100) /
          GetFinalPriceOfProduct()
      );
    }
  };
  const isQtyIsLast = (colorVariant) => {
    if (!colorVariant) return false;
    if (ProductData.collected_after_ordering === 1) return false;
    if (ProductData?.variation?.length > 0) {
      let selected_variant;
      if (
        ProductData?.sync_color_images?.length > 0 &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation?.find(
          (s) =>
            s.type?.toLowerCase() ===
            `${colorVariant?.color_option}-${
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
            (colorVariant?.color_option ?? "")?.toLowerCase()
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
          brandImabge={GetImageUrl(ProductData?.brand?.icon)}
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
              GetImageUrl(ProductData?.images?.[0]) ||
              GetImageUrl(ProductData?.image),
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
            isQtyIsLast={(e) => {
              return isQtyIsLast(e);
            }}
            IsColorHasDiscount={(e) => IsColorHasDiscount(e)}
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
                  selected_size:
                    selectedSize?.option ?? selectedSize?.name ?? selectedSize,
                },
              });
              setSelectedColor(e);
            }}
          />
        )}
        {ProductData?.choice_options?.[0]?.options?.length > 0 ? (
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
        ) : (
          <div className="my-[20px] w-full justify-center items-center flex flex-row">
            {getSelectedVariantQty()?.qty >= 0 &&
            ProductData.collected_after_ordering === 0 &&
            getSelectedVariantQty()?.qty <= 10 ? (
              <span
                className={`${
                  isRtl && "dir-rtl"
                } text-[#FF6200] flex items-center`}
              >
                {translateFunction("Last")} {getSelectedVariantQty()?.qty}
              </span>
            ) : (
              <></>
            )}
          </div>
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
          colors={ProductData?.sync_color_images}
          isCollectAfterOrder={ProductData.collected_after_ordering === 1}
          redeem_price={getSelectedVariantQty()?.redeem_price}
          selected_color={selectedColor}
          selected_size={selectedSize}
          isQtyEmpty={getSelectedVariantQty()?.qty === 0}
          product={ProductData}
          isRedeem={ProductData?.is_redeem && shouldShowRedeem()}
          flashDeal={ProductData?.flash_deal_end_date}
          id={ProductData?.id}
          RedemEnd={() => {
            configureRedeemedProducts(ProductData?.id);
            setProductData({ ...ProductData, is_redeem: false });
            let element = document.querySelector(".product-redeem-counter");
            if (element) {
              element.classList.add("hidden");
            }
          }}
          isInCart={localCart?.find((s) => s.id === ProductData?.id)}
        />
        {shouldShowNotifyButton() ? (
          <NotifyCartButton
            requestLoading={requestLoading}
            setLoading={setRequestLoading}
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
            colors={ProductData?.sync_color_images}
            sizes={ProductData?.choice_options?.[0]?.options}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            selected_variant={getSelectedVariantQty()}
            initialLoading={loading}
            updateQuantity={async (isLocal, type = null, operation) => {
              if (ProductData.collected_after_ordering === 0)
                await updateQuantity({ isLocal, type, operation });
            }}
          />
        ) : (
          <AddToCartButton
            key={product?.is_redeem}
            reachedMaxQty={() => reachedMaxQty()}
            fullQty={localCart.filter((s) => s.id === product?.id)?.length}
            colors={ProductData?.sync_color_images}
            sizes={ProductData?.choice_options?.[0]?.options}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            product={ProductData}
            initialLoading={loading}
            id={ProductData?.id}
            updateQuantity={async (isLocal, type = null, operation) => {
              await updateQuantity({ isLocal, type, operation });
            }}
            expireRedeem={() => {
              setProductData({
                ...ProductData,
                is_redeem: false,
              });
              configureRedeemedProducts(ProductData?.id);
              let element = document.querySelector(".product-redeem-counter");
              if (element) {
                element.classList.add("hidden");
              }
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
  setLoading,
  requestLoading,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  updateQuantity,
}) => {
  const NotifyAction = async () => {
    try {
      setLoading(true);
      await home.AllowNotifications();

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

        await auth.NotifyForProducts({
          id: id,
          variant: selected_variant?.type ?? selected_variant,
        });
        await home.GetFireBaseSettings();
      } else {
        showSuccessNotification(
          translateFunction("You will be notified for this product already"),
          5000
        );
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showErrorNotification(
        error?.message ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access"
          )
      );
      showErrorMessage(
        error?.message ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access"
          )
      );
    }
  };
  return (
    <NotifyButton
      setLoading={setLoading}
      sizes={sizes}
      updateQuantity={async (isLocal, type = null, operation) => {
        await updateQuantity(isLocal, type, operation);
      }}
      colors={colors}
      id={id}
      product={product}
      selectedColor={selectedColor}
      selectedSize={selectedSize}
      selectedVariant={selected_variant}
      isNotified={isNotified}
      loading={initialLoading || requestLoading}
      notifyAction={() => {
        NotifyAction();
      }}
    />
  );
};
