"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  getCart,
  getConfiguredImage,
  LogError,
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

import { showErrorMessage } from "components/global/AddToCartMessage";
const normalizeSize = (s) => {
  if (typeof s === "string") return s.replace(/_/g, "-");
  return s;
};

const buildSizeOptions = (data) => {
  const choiceOptions = data?.choice_options?.[0]?.options;
  if (Array.isArray(choiceOptions) && choiceOptions.length > 0) {
    return choiceOptions;
  }

  const sizesFromField = Array.isArray(data?.sizes) ? data.sizes : [];
  const sizesFromVariation = Array.isArray(data?.variation)
    ? data.variation.map((v) => v?.size).filter(Boolean)
    : [];

  const merged = [...sizesFromField, ...sizesFromVariation]
    .map((s) => (typeof s === "string" ? s.trim() : s))
    .filter(Boolean);

  const unique = Array.from(new Set(merged.map((s) => normalizeSize(s))));

  return unique.map((s) => ({ option: s, name: s }));
};

const resolveDefaultSelection = ({
  productData,
  colorProp,
  colorFromUrl,
  sizeFromUrl,
}) => {
  const colors = productData?.sync_color_images ?? [];
  const sizeOpts = buildSizeOptions(productData);
  const variations = productData?.variation ?? [];
  const hasColors = colors.length > 0;
  const hasSizes = sizeOpts.length > 0;
  const hasVariations = variations.length > 0;
  const isCollect = productData?.collected_after_ordering === 1;

  const findColorObj = (str) => {
    if (!str) return null;
    return (
      colors.find(
        (c) =>
          c?.color_option?.toLowerCase() === str.toLowerCase() ||
          c?.color_name?.toLowerCase() === str.toLowerCase(),
      ) ?? null
    );
  };

  const getColorName = (obj) => obj?.color_name ?? obj?.color_option ?? null;

  const getColorVariations = (name) =>
    name ? variations.filter((v) => v.color?.name === name) : variations;

  const hasColorStock = (name) =>
    getColorVariations(name).some((v) => v.qty > 0);

  const normColor = (obj) => {
    if (!obj) return null;
    return { ...obj, color_option: obj.color_option ?? obj.color_name };
  };

  const findSizeMatch = (str) => {
    if (!str) return null;
    return (
      sizeOpts.find(
        (s) =>
          normalizeSize(s.option ?? s)
            ?.toString()
            .toLowerCase() === str.toLowerCase() ||
          normalizeSize(s.name ?? s)
            ?.toString()
            .toLowerCase() === str.toLowerCase(),
      ) ?? null
    );
  };

  const getSizeVal = (sizeObj) =>
    sizeObj?.option ?? sizeObj?.name ?? sizeObj ?? null;

  // For collect-after-ordering or no variations: pick defaults by priority
  if (isCollect || !hasVariations) {
    return {
      color: hasColors
        ? normColor(
            findColorObj(colorProp) ?? findColorObj(colorFromUrl) ?? colors[0],
          )
        : null,
      size: hasSizes
        ? getSizeVal(findSizeMatch(sizeFromUrl) ?? sizeOpts[0])
        : null,
    };
  }

  // --- Resolve Color ---
  let resolvedColor = null;

  if (hasColors) {
    // Priority: colorProp → colorFromUrl → remaining colors in order
    const candidates = [
      findColorObj(colorProp),
      findColorObj(colorFromUrl),
      ...colors,
    ].filter(Boolean);

    const seen = new Set();
    const uniqueCandidates = candidates.filter((c) => {
      const name = getColorName(c);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    // Pick the first candidate that has at least one in-stock variation
    for (const candidate of uniqueCandidates) {
      if (hasColorStock(getColorName(candidate))) {
        resolvedColor = candidate;
        break;
      }
    }

    // If nothing has stock, fall back to first preferred color
    if (!resolvedColor) resolvedColor = uniqueCandidates[0] ?? colors[0];
  }

  // --- Resolve Size ---
  let resolvedSize = null;

  if (hasSizes) {
    const colorName = getColorName(resolvedColor);
    const relevant = hasColors ? getColorVariations(colorName) : variations;

    const preferred = findSizeMatch(sizeFromUrl);

    if (preferred) {
      const prefVal = normalizeSize(getSizeVal(preferred));
      const match = relevant.find((v) => normalizeSize(v.size) === prefVal);

      if (match && match.qty > 0) {
        resolvedSize = getSizeVal(preferred);
      } else {
        // Preferred size out of stock — pick first in-stock size for this color
        const inStock = relevant.find((v) => v.qty > 0);
        if (inStock?.size) {
          const found = sizeOpts.find(
            (s) =>
              normalizeSize(s.option ?? s) === normalizeSize(inStock.size) ||
              normalizeSize(s.name ?? s) === normalizeSize(inStock.size),
          );
          resolvedSize = getSizeVal(found ?? preferred);
        } else {
          resolvedSize = getSizeVal(preferred);
        }
      }
    } else {
      // No preferred size — pick first in-stock size for this color
      const inStock = relevant.find((v) => v.qty > 0);
      if (inStock?.size) {
        const found = sizeOpts.find(
          (s) =>
            normalizeSize(s.option ?? s) === normalizeSize(inStock.size) ||
            normalizeSize(s.name ?? s) === normalizeSize(inStock.size),
        );
        resolvedSize = getSizeVal(found ?? sizeOpts[0]);
      } else {
        resolvedSize = getSizeVal(sizeOpts[0]);
      }
    }
  }

  return { color: normColor(resolvedColor), size: resolvedSize };
};

import { getProductDataForAddToCart } from "serverRequests";

function AddToCartComponent({ product, slug, color }) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldShowLuck = () => {
    if (!product.is_luck) return false;
    let redeemed_products_ids = getCookie<any[]>("redemed_ids");
    if (redeemed_products_ids) {
      return !redeemed_products_ids.find(
        (s) => s.id === (product?.product_id ?? product?.id),
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
    SelectedProduct,
  } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  const [ProductData, setProductData] = useState({
    ...product,
    is_luck: shouldShowLuck(),
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

  const initialDefaults = resolveDefaultSelection({
    productData: ProductData,
    colorProp: color,
    colorFromUrl,
    sizeFromUrl,
  });
  const [selectedColor, setSelectedColor] = useState(initialDefaults.color);
  const [selectedSize, setSelectedSize] = useState(initialDefaults.size);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

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
      // fetchData({
      //   method: "GET",
      //   url: `/api/mobile/product/details/${slug}`,
      //   reqTitle: { reqTitle: "", code: 100 },
      //   server: "local",
      // });
      let data = await getProductDataForAddToCart({
        language: languageVariable,
        country: country,
        slug: slug,
      });

      let tempProductData = {
        ...product,
        ...data,
        is_luck: data.is_luck && shouldShowLuck(),
        shared_count: 0,
        sync_color_images: !product.singleColor
          ? data.sync_color_images || product?.sync_color_images || []
          : [
              (data?.sync_color_images ?? product?.sync_color_images)?.find(
                (s) =>
                  s?.color_name === data?.sync_color_images?.[0]?.color_name,
              ),
              ...(
                data?.sync_color_images ?? product?.sync_color_images
              )?.filter(
                (s) =>
                  s?.color_name !== data?.sync_color_images?.[0]?.color_name,
              ),
            ],
      };
      if (abortControllerRef.current?.signal.aborted) return;

      setProductData(tempProductData);

      const defaults = resolveDefaultSelection({
        productData: tempProductData,
        colorProp: color,
        colorFromUrl,
        sizeFromUrl,
      });
      setSelectedColor(defaults.color);
      setSelectedSize(defaults.size);

      if (
        product &&
        (selected_product_for_add_to_cart?.id === tempProductData.id ||
          selected_product_for_add_to_cart?.product_id === tempProductData?.id)
      )
        setSelectedProductForCart({
          ...tempProductData,
          shouldUpdate: 0,
        });

      if (abortControllerRef.current?.signal.aborted) return;
      setLoading(false);

      return tempProductData;
    } catch (err) {
      LogError({
        error: err,
        scenario: "getAllProductData for add to cart - add to cart widget",
        slug: product?.slug,
        url: window.location.href,
      });
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  };
  const getProductData = async () => {
    let tempProductData;
    tempProductData = await getAllProductData();
    return tempProductData;
  };

  const sizeOptions = buildSizeOptions(ProductData);
  const hasSizeVariants = sizeOptions.length > 0;
  const hasColorVariants = ProductData?.sync_color_images?.length > 0;

  const findVariantForSelection = (color, size) => {
    if (!ProductData?.variation?.length) return null;
    const colorName = color?.color_name || color?.color_option;
    const sizeVal = size?.option ?? size;

    if (colorName && sizeVal) {
      return ProductData.variation.find(
        (v) => v.color?.name === colorName && v.size === sizeVal,
      );
    }
    if (colorName) {
      return ProductData.variation.find((v) => v.color?.name === colorName);
    }
    if (sizeVal) {
      return ProductData.variation.find((v) => v.size === sizeVal);
    }
    return ProductData.variation[0] ?? null;
  };

  const getSelectedItemCart = () => {
    const selectedVariant = findVariantForSelection(
      selectedColor,
      selectedSize,
    );
    const pvid = selectedVariant?.product_variation_id ?? selectedVariant?.id;

    if (pvid) {
      return localCart?.find(
        (s) =>
          s.product_variation_id === pvid ||
          s.id === pvid ||
          s.variation_id === pvid,
      );
    }

    if (!hasColorVariants && !hasSizeVariants) {
      return localCart?.find((s) => s.id === ProductData.id);
    }

    return null;
  };

  const reachedMaxQty = () => {
    const selectedItem = getSelectedItemCart();
    if (!selectedItem) return false;
    const maxQty = Number(ProductData?.max_allowed_qty);
    if (maxQty === 0) return false;
    return selectedItem.quantity >= maxQty;
  };
  const getVariantSizeQty = (size) => {
    if (!ProductData?.variation?.length) {
      return {
        qty: ProductData?.available_quantity,
        offer_price: ProductData?.offer_price,
        luck_price: ProductData?.luck_price,
        variant_notify_for_user: ProductData?.is_product_notify_for_user,
      };
    }
    const selected_variant = findVariantForSelection(selectedColor, size);
    return {
      ...selected_variant,
      offer_price: selected_variant?.offer_price,
      luck_price: selected_variant?.luck_price ?? ProductData?.luck_price,
    };
  };
  const IsValid = () => {
    let color_valid = false,
      size_valid = false;
    if (!hasColorVariants) color_valid = true;
    else color_valid = Boolean(selectedColor);
    if (!hasSizeVariants) size_valid = true;
    else size_valid = Boolean(selectedSize);
    return color_valid && size_valid;
  };

  const getSelectedVariantQty = () => {
    const noVariantFallback = {
      product_variation_id: null,
      price: ProductData?.price,
      offer_price: ProductData?.offer_price,
      luck_price: ProductData?.luck_price,
      qty: ProductData?.available_quantity,
      variant_notify_for_user: ProductData?.is_product_notify_for_user,
    };

    if (!IsValid()) return noVariantFallback;

    if (ProductData?.variation?.length > 0) {
      const selected_variant = findVariantForSelection(
        selectedColor,
        selectedSize,
      );
      return {
        ...selected_variant,
        offer_price: selected_variant?.offer_price,
        luck_price: selected_variant?.luck_price ?? ProductData?.luck_price,
      };
    }

    return noVariantFallback;
  };

  const initializeUI = async () => {
    try {
      await getProductData();
      setSelectedProductForCart({
        ...selected_product_for_add_to_cart,
        done: true,
      });
    } catch (error) {
      LogError({
        error: error,
        scenario: "get Initial Data for add to cart - add to cart widget",
        slug: product?.slug,
        url: window.location.href,
      });
    }
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    if (
      document.querySelector<HTMLElement>(".alternate-product-details-footer")
    )
      document.querySelector<HTMLElement>(
        ".alternate-product-details-footer",
      ).style.display = "none";
    initializeUI();
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (
        document.querySelector<HTMLElement>(".alternate-product-details-footer")
      )
        document.querySelector<HTMLElement>(
          ".alternate-product-details-footer",
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

      reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS,
      signal: abortControllerRef.current?.signal,
    });

    if (abortControllerRef.current?.signal.aborted) return;
    setProductData({
      ...ProductData,
      ...response.data,
      variation: response.data.variations?.map((variant) => {
        return {
          ...variant,
          notify_for_user: ProductData?.variation?.find(
            (s) =>
              (s.product_variation_id ?? s.id) ===
              (variant.product_variation_id ?? variant.id),
          )?.notify_for_user,
        };
      }),
      is_luck: response?.data?.is_luck && shouldShowLuck(),
    });
  };
  const updateQuantityLocally = (variantId, operation) => {
    setProductData({
      ...ProductData,
      variation: ProductData?.variation?.map((s) => {
        const sId = s.product_variation_id ?? s.id;
        if (sId !== variantId) {
          return s;
        }
        return {
          ...s,
          qty: operation === "add" ? s.qty - 1 : s.qty + 1,
        };
      }),
      available_quantity:
        operation === "add"
          ? ProductData.available_quantity - 1
          : ProductData.available_quantity + 1,
      is_luck: ProductData?.is_luck && shouldShowLuck(),
    });
  };
  const updateQuantity = async ({ isLocal = true, variantId, operation }) => {
    if (isLocal) updateQuantityLocally(variantId, operation);
    else await updateQuantityRemotley();
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  const GetFinalPriceOfProduct = () => {
    if (ProductData?.is_luck && shouldShowLuck()) {
      return ProductData?.luck_price;
    }
    return ProductData?.offer_price;
  };
  const IsColorHasDiscount = (colorVariant) => {
    if (!colorVariant) return false;
    if (hasSizeVariants && !selectedSize) return false;
    const variant = ProductData?.variation?.find((s) => {
      const vColor = s.color?.name;
      if (hasSizeVariants && selectedSize) {
        return (
          vColor === colorVariant?.color_name &&
          s.size === (selectedSize?.option ?? selectedSize)
        );
      }
      return vColor === colorVariant?.color_name;
    });
    if (!variant) return false;
    if (ProductData?.is_luck && shouldShowLuck()) {
      return Math.round(
        ((GetFinalPriceOfProduct() - variant?.luck_price) * 100) /
          GetFinalPriceOfProduct(),
      );
    } else {
      return Math.round(
        ((GetFinalPriceOfProduct() - variant?.offer_price) * 100) /
          GetFinalPriceOfProduct(),
      );
    }
  };
  const isQtyIsLast = (colorVariant) => {
    if (!colorVariant) return false;
    if (ProductData.collected_after_ordering === 1) return false;
    if (!ProductData?.variation?.length) {
      return {
        qty: ProductData?.available_quantity,
        offer_price: ProductData?.offer_price,
      };
    }
    const selected_variant = findVariantForSelection(
      colorVariant,
      selectedSize,
    );
    return {
      ...selected_variant,
      offer_price: selected_variant?.offer_price,
      luck_price: selected_variant?.luck_price ?? ProductData?.luck_price,
    };
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
                  ProductData?.sync_color_images?.[0]?.images?.[0]?.file_path,
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
            getSelectedItemCart()?.is_luck
              ? getSelectedItemCart()?.offer_price
              : getSelectedVariantQty()?.offer_price
          }
          price={getSelectedVariantQty()?.price}
          luck_price={shouldShowLuck() && getSelectedVariantQty()?.luck_price}
          shippingDays={ProductData?.shipping_days}
          shouldShowOrangeBorder={
            ProductData.is_luck ||
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
                  color.option === s.color_option ||
                  color.name === s.color_name,
              ),
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
                  category: ProductData?.categories?.[0]?.name,
                  category_id: ProductData?.categories?.[0]?.id,
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
        {hasSizeVariants ? (
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
                  category: ProductData?.categories?.[0]?.name,
                  category_id: ProductData?.categories?.[0]?.id,
                  price: ProductData?.offer_price,
                  selected_color:
                    selectedColor?.color_option ?? selectedColor?.color_name,
                  selected_size: e?.option ?? e?.name ?? e,
                },
              });
              setSelectedSize(e);
            }}
            sizes={sizeOptions}
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
          is_luck={ProductData.is_luck}
          currency={currency}
          language={languageVariable}
          offer_price={
            getSelectedItemCart()?.is_luck
              ? getSelectedItemCart()?.offer_price
              : getSelectedVariantQty()?.offer_price
          }
          price={getSelectedVariantQty()?.price}
          id={ProductData?.id}
          luck_price={
            shouldShowLuck() &&
            ProductData?.is_luck &&
            getSelectedVariantQty()?.luck_price
          }
          shipping_cost={product?.shipping_cost}
        />
        <ExtraInfoArea
          colors={ProductData?.sync_color_images}
          isCollectAfterOrder={ProductData.collected_after_ordering === 1}
          luck_price={getSelectedVariantQty()?.luck_price}
          selected_color={selectedColor}
          selected_size={selectedSize}
          isQtyEmpty={getSelectedVariantQty()?.qty === 0}
          product={ProductData}
          isLuck={ProductData?.is_luck && shouldShowLuck()}
          flashDeal={ProductData?.flash_deal_end_date}
          id={ProductData?.id}
          LuckEnd={() => {
            configureRedeemedProducts(ProductData?.id);
            setProductData({ ...ProductData, is_luck: false });
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
                  const selectedPvid =
                    getSelectedVariantQty()?.product_variation_id ??
                    getSelectedVariantQty()?.id;
                  const sPvid = s.product_variation_id ?? s.id;
                  if (sPvid === selectedPvid) {
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
            sizes={sizeOptions}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            selected_variant={getSelectedVariantQty()}
            initialLoading={loading}
            updateQuantity={async (isLocal, variantId = null, operation) => {
              if (ProductData.collected_after_ordering === 0)
                await updateQuantity({ isLocal, variantId, operation });
            }}
          />
        ) : (
          <AddToCartButton
            key={ProductData?.is_luck}
            reachedMaxQty={() => reachedMaxQty()}
            fullQty={localCart.filter((s) => s.id === product?.id)?.length}
            colors={ProductData?.sync_color_images}
            sizes={sizeOptions}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            product={ProductData}
            initialLoading={loading}
            id={ProductData?.id}
            updateQuantity={async (isLocal, variantId = null, operation) => {
              if (ProductData.collected_after_ordering === 0)
                await updateQuantity({ isLocal, variantId, operation });
            }}
            expireLuck={() => {
              setProductData({
                ...ProductData,
                is_luck: false,
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
          variant:
            selected_variant?.product_variation_id ?? selected_variant?.id,
        });
        await home.GetFireBaseSettings();
      } else {
        showSuccessNotification(
          translateFunction("You will be notified for this product already"),
          5000,
        );
      }
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Notify Action add to cart - add to cart widget",
        slug: product?.slug,
        url: window.location.href,
      });
      setLoading(false);
      showErrorNotification(
        error?.message ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
      );
      showErrorMessage(
        error?.message ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
      );
    }
  };
  return (
    <NotifyButton
      setLoading={setLoading}
      sizes={sizes}
      updateQuantity={async (isLocal, variantId = null, operation) => {
        await updateQuantity(isLocal, variantId, operation);
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
