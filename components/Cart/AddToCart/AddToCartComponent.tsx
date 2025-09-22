"use client";
import React, { useEffect, useState } from "react";
import {
  getCart,
  getConfiguredImage,
  translateFunction,
} from "utils/functions";
import { useAppStore } from "store";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import auth from "services/auth";
import home from "services/home";

import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GetImageUrl } from "utils/tinyUtils";
import { GAevent } from "utils/gtag";
import { showSuccessNotification } from "@/store/notifications/reducer";
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

function AddToCartComponent({ product, slug, close, enableCartAction }) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowRedeem = () => {
    let redeemed_products_ids = getCookie<any[]>("redemed_ids");
    if (redeemed_products_ids) {
      return !redeemed_products_ids.find((s) => s.id === product?.id);
    }
    return true;
  };
  useEffect(() => {
    window.history.pushState({ isPopup: true }, "add cart");
    const newParams = new URLSearchParams(searchParams);
    newParams.set("modal", "true");
    // Use router.push with pathname and updated query
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
  }, []);
  const searchParams = useSearchParams();
  const [sizeFromUrl, colorFromUrl] = [
    searchParams.get("size"),
    searchParams.get("color"),
  ];
  const { localCart, currency, setSelectedProductForCart, initCart } =
    useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  const [ProductData, setProductData] = useState({
    ...product,
    is_redeem: product?.is_redeem && shouldShowRedeem(),
  });

  const [selectedColor, setSelectedColor] = useState(
    ProductData?.sync_color_images?.find(
      (s) =>
        s?.color_option?.toLowerCase() === colorFromUrl?.toLowerCase() ||
        s?.color_name?.toLowerCase() === colorFromUrl?.toLowerCase()
    ) || null
  );
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

  const getProductData = async () => {
    try {
      setLoading(true);
      getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      let [data1, data2, data3, data4] = await Promise.all([
        (async () => {
          let response = await fetchData({
            url: `/web/product/qtyPriceDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VRIANTES,
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
            url: `/web/product/likesDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS_NOTIFICATIONS,
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
        (async () => {
          let response = await fetchData({
            url: `/web/product/globalDetails/${slug}`,
            reqTitle: REQUESTS_DATA.GET_PRODUCT_GLOBAL_DETAILS,
            method: "GET",
            server: "market",
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          return response;
        })(),
      ]);

      let variants_arr = data1.data.variation;
      let newVariants = data2.data.variation.map((item) => {
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
        ...data4.data,
        ...data3,
        shared_count: product?.shared_count || 0,
        variation: newVariants,
        sync_color_images: !product.singleColor
          ? data4.data.sync_color_images || []
          : [
              data4?.data?.sync_color_images?.find(
                (s) =>
                  s?.color_name === product?.sync_color_images?.[0]?.color_name
              ),
              ...data4?.data?.sync_color_images?.filter(
                (s) =>
                  s?.color_name !== product?.sync_color_images?.[0]?.color_name
              ),
            ],
      };

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
      if (product)
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
      setLoading(false);
    } catch (err) {
      // Handle error as needed
      console.error(err);
      setLoading(false);
    }
  };
  const checkIfVariantEmpty = () => {
    let selectedVariant = getSelectedVariantQty();

    if (selectedVariant?.qty === 0) {
      if (ProductData?.variation?.filter((s) => s.qty > 0)?.length === 0) {
        return;
      } else {
        if (
          ProductData?.sync_color_images &&
          ProductData?.variation?.length > 0
        ) {
          let otherVariant = ProductData?.variation?.find((s) => s.qty > 0);
          let otherColor = otherVariant?.type?.split("-");
          setSelectedColor(
            ProductData?.sync_color_images?.find(
              (s) =>
                s?.color_option?.toLowerCase() ===
                otherColor?.[0]?.toLowerCase()
            )
          );
          if (otherColor?.[1]) {
            setSelectedSize(
              ProductData?.choice_options?.[0]?.options.find(
                (s) =>
                  s.option?.toLowerCase() === otherColor?.[1]?.toLowerCase()
              )
            );
          }

          return;
        }
        if (ProductData?.choice_options?.[0]) {
          let otherVariant = ProductData?.variation?.find((s) => s.qty > 0);
          let otherSize = otherVariant?.type?.split("-");
          setSelectedSize(
            ProductData?.choice_options?.[0]?.options.find(
              (s) => s.option?.toLowerCase() === otherSize?.[0]?.toLowerCase()
            )
          );
        }
      }
    }
    return;
  };

  const getVariantSizeQty = (size) => {
    if (ProductData?.variation?.length > 0) {
      let selected_variant = ProductData?.variation.find(
        (s) =>
          s.type.startsWith(selectedColor?.color_option ?? "") &&
          s.type.endsWith((size && `-${size?.replace(" ", "")}`) ?? "")
      );
      return selected_variant;
    } else {
      return 0;
    }
  };

  const getSelectedVariantQty = () => {
    if (ProductData?.variation?.length > 0) {
      let selected_variant;
      if (
        ProductData?.sync_color_images?.length > 0 &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation.find(
          (s) =>
            s.type.startsWith(selectedColor?.color_option ?? "") &&
            s.type.endsWith(
              (selectedSize?.option &&
                `-${selectedSize?.option?.replace(" ", "")}`) ??
                ""
            )
        );
      }
      if (
        ProductData?.sync_color_images?.length > 0 &&
        (!ProductData?.choice_options ||
          ProductData?.choice_options?.length === 0)
      ) {
        selected_variant = ProductData?.variation.find((s) =>
          s.type.startsWith(selectedColor?.color_option ?? "")
        );
      }
      if (
        (!ProductData?.sync_color_images ||
          ProductData?.sync_color_images?.length === 0) &&
        ProductData?.choice_options?.length > 0
      ) {
        selected_variant = ProductData?.variation.find((s) =>
          s.type.endsWith(
            (selectedSize?.option &&
              `${selectedSize?.option?.replace(" ", "")}`) ??
              ""
          )
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
    if (
      document.querySelector<HTMLElement>(".alternate-product-details-footer")
    )
      document.querySelector<HTMLElement>(
        ".alternate-product-details-footer"
      ).style.display = "none";
    getProductData();
    return () => {
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
  const updateQuantity = async (type, qty) => {
    let response = await fetchData({
      method: "GET",
      server: "market",
      url: `/web/product/qtyPriceDetails/${slug}`,
      useCached: false,
      reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS,
    });

    setProductData({
      ...ProductData,
      variation: response.data.variation.map((s) => {
        return {
          ...s,
          qty: s.qty,
          notify_for_user: ProductData?.variation?.find((s) => s.type === type)
            ?.notify_for_user,
        };
      }),
      is_redeem: response.data.is_redeem && shouldShowRedeem(),
    });
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
      <div className="flex flex-col justify-start items-start w-full max-h-[75vh] h-full pt-[32px] overflow-y-auto pb-[213px]">
        <Card
          brandImabge={GetImageUrl(
            getConfiguredImage({ src: ProductData?.brand?.icon, height: 15 })
          )}
          image={getConfiguredImage({
            src:
              (selectedColor?.images?.[0]?.file_path &&
                GetImageUrl(selectedColor?.images?.[0]?.file_path)) ||
              GetImageUrl(selectedColor?.images?.[0]) ||
              (ProductData?.images?.[0]?.file_path &&
                GetImageUrl(ProductData?.images?.[0]?.file_path)) ||
              GetImageUrl(ProductData?.images?.[0]),
            width: 400,
            height: 400,
          })}
          name={ProductData?.name}
          offer_price={getSelectedVariantQty()?.offer_price}
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
            colors={ProductData?.sync_color_images}
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
            isSizeNotified={(e) =>
              getVariantSizeQty(e)?.variant_notify_for_user
            }
            qty={getSelectedVariantQty()?.qty}
            sizeQty={(e) => getVariantSizeQty(e)?.qty}
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
      <div className="flex pb-[18px] flex-col w-full min-h-[136px] rounded-t-[30px] gap-[8px] h-auto fixed bottom-0 bg-[#FFFFFF] shadow-[0px_-3px_20px_rgb(0,0,0,0.1)] z-50">
        <PricesRow
          currency={currency}
          language={languageVariable}
          offer_price={getSelectedVariantQty()?.offer_price}
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
          redeem_price={getSelectedVariantQty()?.redeem_price}
          selected_color={selectedColor}
          selected_size={selectedSize}
          isQtyEmpty={getSelectedVariantQty()?.qty === 0}
          isRedeem={ProductData?.is_redeem && shouldShowRedeem()}
          flashDeal={ProductData?.flash_deal_end_date}
          id={ProductData?.id}
          RedemEnd={() => {
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
                  ProductData?.variation?.length > 0
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
            onSuccessAddUpdate={() => {}}
            fullQty={localCart.filter((s) => s.id === product?.id)?.length}
            colors={ProductData?.sync_color_images}
            sizes={ProductData?.choice_options?.[0]?.options}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            product={ProductData}
            initialLoading={loading && product?.is_from_listing}
            id={ProductData?.id}
            updateQuantity={async (type, qty) => updateQuantity(type, qty)}
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
    if (typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission();
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
