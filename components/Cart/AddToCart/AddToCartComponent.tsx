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
import { getProductDataForAddToCart } from "serverRequests";

function AddToCartComponent({ product, slug, close, enableCartAction }) {
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

  let selected_color =
    ProductData?.sync_color_images?.find(
      (s) =>
        s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
        s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase(),
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
  const [selectedSize, setSelectedSize] = useState(() => {
    const initialSizes = buildSizeOptions(ProductData);
    return (
      initialSizes.find(
        (option) =>
          option.option?.toLowerCase() === sizeFromUrl?.toLowerCase() ||
          option.name?.toLowerCase() === sizeFromUrl?.toLowerCase(),
      ) ||
      initialSizes[0] ||
      null
    );
  });
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

      const selColor =
        selectedColor?.color_name || selectedColor?.color_option || null;
      const selSize =
        typeof selectedSize === "string"
          ? selectedSize
          : selectedSize?.option || null;

      const inStock = (v) => v.qty > 0;

      const exact = variations.find((v) => {
        const vColor = v.color?.name;
        const vSize = v.size;
        return (
          (!selColor || vColor === selColor) && (!selSize || vSize === selSize)
        );
      });

      if (exact && inStock(exact)) {
        return {
          variant: exact,
          color: exact.color?.name,
          size: exact.size,
        };
      }

      function rankVariants(source) {
        return source
          .map((v) => {
            let score = 0;
            if (selColor && v.color?.name === selColor) score += 2;
            if (selSize && v.size === selSize) score += 1;
            return { v, color: v.color?.name, size: v.size, score };
          })
          .sort((a, b) => b.score - a.score);
      }

      const inStockVariants = variations.filter(inStock);

      if (inStockVariants.length > 0) {
        const best = rankVariants(inStockVariants)[0];
        return { variant: best.v, color: best.color, size: best.size };
      }

      const best = rankVariants(variations)[0];
      return { variant: best.v, color: best.color, size: best.size };
    } catch (error) {
      LogError({
        error: error,
        scenario: "resolve variant for add to cart - add to cart widget",
        slug: product?.slug,
        url: window.location.href,
      });
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
      console.log("data from server", data);
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
      if (product?.singleColor) {
        // setSelectedColor(tempProductData?.sync_color_images[0]);
      } else if (colorFromUrl) {
        setSelectedColor(
          tempProductData?.sync_color_images?.find(
            (s) =>
              s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
              s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase(),
          ) ?? tempProductData?.sync_color_images?.[0],
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

      const tempSizeOptions = buildSizeOptions(tempProductData);
      if (tempSizeOptions.length > 0) {
        if (sizeFromUrl?.length > 0) {
          setSelectedSize(
            tempSizeOptions.find(
              (s) =>
                s.option?.toLowerCase() === sizeFromUrl?.toLowerCase() ||
                s.name?.toLowerCase() === sizeFromUrl?.toLowerCase(),
            )?.option ?? tempSizeOptions?.[0]?.option,
          );
        } else {
          // setSelectedSize(tempSizeOptions?.[0]);
        }
      }
      // checkIfVariantEmpty();

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
      return localCart?.find((s) => s.product_variation_id === pvid);
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
      let tempProductData = await getProductData();
      const tempSizeOptions = buildSizeOptions(tempProductData);
      let res = resolveVariant({
        colors: tempProductData.sync_color_images,
        isForCollect: tempProductData?.collected_after_ordering === 1,
        variations: tempProductData?.variation,
        sizes: tempSizeOptions,
        selectedColor:
          selectedColor ??
          product?.sync_color_images?.find(
            (s) =>
              s?.color_name === product?.sync_color_images?.[0]?.color_name,
          ),
        selectedSize: selectedSize ?? tempSizeOptions?.[0],
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
              s?.color_option === res.color,
          ),
        );
      }
      if (res.size) {
        setSelectedSize(
          tempSizeOptions?.find(
            (s) => s.option === res.size || s.name === res.size,
          )?.option,
        );
      }
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
      useCached: false,
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
