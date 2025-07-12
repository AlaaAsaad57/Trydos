"use client";
import React, { useEffect, useState } from "react";

import BackIcon from "public/svg/listing/backIcon.svg";
import {
  getCart,
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { useAppStore } from "store";
import CartIcon from "public/svg/CartIcon.svg";

import Skeleton from "react-loading-skeleton";
import "public/styles/sizeSlider.css";
import Spinner from "components/global/Spinner";
import { useParams, useSearchParams } from "next/navigation";

import NotifySVG from "public/svg/cart/NotifyCart.svg";
import cart from "services/cart";

import auth from "services/auth";
import home from "services/home";
import { SliderRuler } from "./SliderRuler";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { DetectScreen, GetImageUrl } from "utils/tinyUtils";
import { GAevent } from "utils/gtag";
import { showSuccessNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import StackedSlider from "utils/Slider";

function AddToCartComponent({
  color,
  size,
  product,
  slug,
  close,

  enableCartAction,
}) {
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
  const [ProductData, setProductData] = useState(product);
  const [selectedColor, setSelectedColor] = useState(
    ProductData?.sync_color_images?.find(
      (s) => s.color_option?.toLowerCase() === colorFromUrl?.toLowerCase()
    ) || ProductData?.sync_color_images?.[0]
  );
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const getProductData = async () => {
    try {
      setLoading(true);
      getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      let [data1, data2, data3, data4] = await Promise.all([
        fetchData({
          url: `/web/product/qtyPriceDetails/${slug}`,
          reqTitle: "Get Product Vriantes",
          method: "GET",
          server: "market",
        }),
        fetchData({
          url: `/web/product/likesDetails/${slug}`,
          reqTitle: "GEt Product Variants Notifications",
          method: "GET",
          server: "market",
        }),
        fetchData({
          url: `/api/v2/elastic/shared_count/${product.id}`,
          reqTitle: "Share Count Request",
          method: "GET",
          server: "chat",
          useCached: true,
        }),
        fetchData({
          url: `/web/product/globalDetails/${slug}`,
          reqTitle: "GEt Product Global Details",
          method: "GET",
          server: "market",
        }),
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
        ...data2.data,
        ...data4.data,
        shared_count: data3.data.shared_count,
        variation: newVariants,
      };
      setProductData(tempProductData);
      setSelectedColor(
        tempProductData?.sync_color_images?.find(
          (s) => s.color_option?.toLowerCase() === colorFromUrl?.toLowerCase()
        ) || tempProductData?.sync_color_images?.[0]
      );
      if (tempProductData?.choice_options?.[0]?.options?.length > 0) {
        if (sizeFromUrl?.length > 0) {
          setSelectedSize(
            tempProductData?.choice_options?.[0]?.options.find(
              (s) => s.option?.toLowerCase() === sizeFromUrl?.toLowerCase()
            )
          );
        } else {
          setSelectedSize(tempProductData?.choice_options?.[0]?.options?.[0]);
        }
      }

      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  };

  const getInitialColorSlide = () => {
    let index = 0;
    ProductData?.sync_color_images.map((s, i) => {
      if (s.color_option === colorFromUrl) index = i;
    });
    return index;
  };
  const getVariantSizeQty = (size) => {
    if (ProductData?.variation?.length > 0) {
      let selected_variant = ProductData?.variation.find(
        (s) =>
          s.type.startsWith(selectedColor?.color_option ?? "") &&
          s.type.endsWith((size && `-${size}`) ?? "")
      );
      return selected_variant?.qty;
    } else {
      return 0;
    }
  };
  const getInitialSizeSlider = () => {
    let index = 0;
    ProductData?.choice_options?.[0]?.options.map((s, i) => {
      if (s.option === sizeFromUrl) index = i;
    });
    return index;
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
              (selectedSize?.option && `-${selectedSize?.option}`) ?? ""
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
            (selectedSize?.option && `${selectedSize?.option}`) ?? ""
          )
        );
      }
      return selected_variant;
    } else {
      // no variants
      return {
        type: "N/A",
        price: ProductData?.price,
        offer_price: ProductData?.offer_price,
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
      reqTitle: "Get Product Variants",
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
    });
  };

  return (
    <div className="flex-col message-add-to-cart h-full w-[100vw] flex top-0 left-0 fixed z-[99999999999999999] justify-start  ">
      {/* <ToastContainer
        position="top-right"
        style={{ zIndex: "9999999999999999" }}
      /> */}
      <div className=" bg-[#4f4f4f80]  flex fixed top-0 left-0 h-full w-full z-[99] backdrop-container" />
      <div className="back-bar align-center w-100 flex-row min-h-12 bg-[#fff] p-4 z-[99999999] justify-between">
        <div
          className="back-icon p-0"
          data-cy="Back-Icon-AddToCart"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.BACK_ICON_IN_ADD_TO_CART_WIDGET,
            // });
            setSelectedProductForCart(null);
            document.documentElement.style.overflow = "initial";
            document.documentElement.scrollTop = 0;
            close();
          }}
        >
          <BackIcon />
        </div>
        <span
          className="relative"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CART_ICON,
            // });
            enableCartAction(true);
            document.documentElement.style.overflow = "initial";
            document.documentElement.scrollTop = 0;
            close();
          }}
        >
          {localCart?.length > 0 && (
            <span className="bg-green-500 right-[-8px] top-[-4px] text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
              {localCart.length}
            </span>
          )}
          <CartIcon data-cy="CartIcon" id={"cart-icon"} className="cart-icon" />
        </span>
      </div>
      <div
        data-cy="image_when_addtocart"
        style={{ height: "calc(100vh - 461px)" }}
        className="flex-col mt-[10px] w-full   top-[103px] items-center z-[999999999]"
        onClick={(e) => {
          if (
            !(e.target as HTMLDivElement).classList.contains(
              "image-cart-container"
            ) &&
            !(e.target as HTMLDivElement).classList.contains(
              "color_option_cyrcle"
            ) &&
            !(e.target as HTMLDivElement).classList.contains("slider_slide")
          ) {
            // setSelectedProductForCart(null);
            // document.documentElement.style.overflow = "initial";
            // document.documentElement.scrollTop = 0;
            // close();
          }
        }}
      >
        <div
          data-cy="image_when_addtocart_container"
          className="flex-row w-auto justify-center h-available relative rounded-[15px] inset-select-shadow-image image-cart-container"
        >
          <svg
            data-cy="image_when_addtocart_svg"
            className="absolute top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="calc(100%)"
            height="calc(100%)"
          >
            <g
              id="Rectangle_5686"
              data-name="Rectangle 5686"
              fill="none"
              stroke="#FFF"
              strokeWidth="0.5"
            >
              <rect
                width="calc(100%)"
                height="calc(100%)"
                rx="15"
                stroke="none"
              />
              <rect
                x="0.25"
                y="0.25"
                width="calc(100%)"
                height="calc(100%)"
                rx="14.75"
                fill="none"
              />
            </g>
          </svg>
          <img
            data-cy="image_when_addtocart_image"
            id={"added-to-cart"}
            src={getConfiguredImage({
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
            className={`min-h-[80px] h-full object-top rounded-[15px]`}
          />
        </div>
        {ProductData?.sync_color_images && (
          <div
            data-cy="color_option_cyrcle"
            className="flex w-full max-w-[420px] color_option_cyrcle "
          >
            <StackedSlider
              initial_index={getInitialColorSlide()}
              max_drag={100}
              max_scale={1}
              min_scale={0.6}
              onSlideChange={(index) => {
                setSelectedColor(ProductData?.sync_color_images[index]);
              }}
              slidesArray={ProductData?.sync_color_images?.map((s, i) => i)}
              slide_width={70}
              overlap_factor={0.4}
              renderSlide={({ index, isActive, slide_width }) => {
                let color = ProductData?.sync_color_images[index];
                console.log(color);
                return (
                  <div className="w-[70px] color_option_cyrcle h-[70px] color-swipe-slide relative rounded-full">
                    <img
                      src={getConfiguredImage({
                        src:
                          (typeof color.images[0] === "string" &&
                            GetImageUrl(color.images[0])) ||
                          (color.images[0].file_path &&
                            GetImageUrl(color.images[0].file_path)),
                        height: 70,
                        width: 70,
                      })}
                      className="w-[70px] h-[70px] rounded-full bg-white"
                    />
                    {isActive && (
                      <span
                        data-cy="color_name"
                        className="regular text-[#3C3C3C] text-[14px] absolute bottom-[-20px] w-full flex justify-center items-center"
                      >
                        {color.color_name}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
      {loading ? (
        <SizesSkeleton product={ProductData} />
      ) : (
        <div
          data-cy="product_details_addtocart"
          className="product-details-footer product_details_addtocart z-[9999] min-h-[100px] h-auto"
        >
          <div
            data-cy="product_info_container_addtocart"
            className="product-info-container"
          >
            <div
              data-cy="product_info_price_addtocart"
              className="product-info-price"
            >
              {currency?.symbol &&
                getSelectedVariantQty()?.offer_price !==
                  getSelectedVariantQty()?.price && (
                  <div
                    data-cy="product_old_price_addtocart"
                    className="product-old-price"
                  >
                    <svg
                      data-cy="product_addtocart_svg"
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      height="2"
                    >
                      <line
                        id="Line_1104"
                        data-name="Line 1104"
                        x2="100%"
                        transform="translate(0 1)"
                        fill="none"
                        stroke="#C4C2C2"
                        strokeWidth="2"
                      />
                    </svg>
                    {getSelectedVariantQty()?.price >= 0 && currency?.symbol ? (
                      <>
                        {RoundPrice({
                          num: getSelectedVariantQty()?.price,
                          language: languageVariable,
                        })}
                      </>
                    ) : (
                      <Skeleton width={30} height={10} />
                    )}
                  </div>
                )}
              <div
                data-cy="product_new-price_addtocart"
                className="product-new-price"
              >
                {getSelectedVariantQty()?.offer_price >= 0 &&
                currency?.symbol ? (
                  <>
                    {RoundPrice({
                      num: getSelectedVariantQty()?.offer_price,
                      language: languageVariable,
                    })}
                  </>
                ) : (
                  <Skeleton width={30} height={10} />
                )}
              </div>
              <div data-cy="product_currency" className="product-currency">
                {currency?.symbol ?? (
                  <Skeleton
                    data-cy="product_Skeleton"
                    containerClassName="flex items-center"
                    className="flex items-center"
                    width={20}
                    height={10}
                  />
                )}
              </div>
              <div data-cy="product_Skeleton_info_icon" className="info-icon">
                <svg
                  data-cy="product_Skeleton_info_icon_svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <g
                    id="Group_10807"
                    data-name="Group 10807"
                    transform="translate(-65 -464)"
                  >
                    <g
                      id="Group_10756"
                      data-name="Group 10756"
                      transform="translate(65 464)"
                    >
                      <path
                        id="Subtraction_1"
                        data-name="Subtraction 1"
                        d="M.262,9.636a.258.258,0,0,1-.156-.054.29.29,0,0,1-.1-.3L.675,7.091A4.792,4.792,0,0,1,0,4.636,4.554,4.554,0,0,1,4.458,0,4.554,4.554,0,0,1,8.914,4.636,4.555,4.555,0,0,1,4.458,9.273a4.341,4.341,0,0,1-2.5-.794L.409,9.589A.238.238,0,0,1,.262,9.636ZM4.416,6.982a.571.571,0,1,0,.562.571A.558.558,0,0,0,4.416,6.982Zm.115-4.55a.879.879,0,0,1,.954.88c0,.432-.183.7-.7,1.023a1.433,1.433,0,0,0-.817,1.288v.1c0,.319.171.518.447.518.255,0,.4-.162.426-.469.021-.445.181-.669.714-1a1.684,1.684,0,0,0-.987-3.16A1.8,1.8,0,0,0,2.812,2.6a1.186,1.186,0,0,0-.115.518.386.386,0,0,0,.413.434c.224,0,.349-.108.43-.372A.951.951,0,0,1,4.531,2.432Z"
                        transform="translate(0 2.364)"
                        fill="#8e8e8e"
                      />
                      <path
                        id="Path_21380"
                        data-name="Path 21380"
                        d="M10.677,9.661a.259.259,0,0,1-.157.055.237.237,0,0,1-.147-.047L8.824,8.559l-.017.011a5.314,5.314,0,0,0,.4-2.036A5.089,5.089,0,0,0,4.227,1.352a4.724,4.724,0,0,0-1.094.127A4.326,4.326,0,0,1,6.325.079a4.555,4.555,0,0,1,4.457,4.636,4.778,4.778,0,0,1-.675,2.455l.664,2.189a.287.287,0,0,1-.094.3Z"
                        transform="translate(0.23 0.466)"
                        fill="#8e8e8e"
                      />
                      <rect
                        id="Rectangle_4714"
                        data-name="Rectangle 4714"
                        width="11.536"
                        height="12"
                        transform="translate(0.464)"
                        fill="none"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
            <div
              data-cy="product_info_properties"
              className="product-info-properties"
            >
              <div data-cy="product_info_item" className="product-prop-item">
                {translateFunction("All Inclusive Without Additions")}
              </div>
              {ProductData?.shipping_cost === 0 && (
                <div
                  data-cy="product_prop_item_properties"
                  className="product-prop-item"
                >
                  <img
                    data-cy="product_prop_item_img"
                    width={15}
                    height={15}
                    alt="truck"
                    src="/svg/greentruck.svg"
                  />
                  <span data-cy="free_shipping_text">
                    {translateFunction("Free Shipping")}
                  </span>
                </div>
              )}
              <div data-cy="product_prop_item2" className="product-prop-item">
                <img
                  data-cy="product_prop_item2_img"
                  width={15}
                  height={15}
                  alt="truck"
                  src="/svg/redtruck.svg"
                />
                <span data-cy="free_shipping_text2">
                  {translateFunction("Free Return")}
                </span>
              </div>
              <div data-cy="product_prop_item3" className="product-prop-item">
                <img
                  data-cy="product_prop_item3_img"
                  width={10}
                  height={15}
                  alt="deliveryman"
                  src="/svg/deliveryman.svg"
                />
                <span data-cy="free_shipping_text3">
                  {translateFunction("Ship To You Accepted")}{" "}
                  {translateFunction("2 June")}
                </span>
              </div>
            </div>
          </div>
          {ProductData?.choice_options?.length > 0 && (
            <div
              data-cy="Extended_area_product"
              className="Extended-area-product"
            >
              <svg
                data-cy="border_svg_extended"
                className="border-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="1.7"
              >
                <line
                  id="Line_1104"
                  data-name="Line 1104"
                  x2="100%"
                  y2="1"
                  transform="translate(0.001 0.35)"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="0.7"
                />
              </svg>
              <div
                data-cy="extended_components"
                className="flex-col items-center justify-center pt-[20px] w-full h-[235px] regular text-[14px] text-[#505050] pl-5 pr-5"
              >
                <div
                  data-cy="extended_component_svg"
                  className="flex-row items-center"
                >
                  <svg
                    data-cy="svg_extended_component_svg"
                    id="Group_3644"
                    data-name="Group 3644"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <g id="Group_3124" data-name="Group 3124">
                      <path
                        id="Path_14086"
                        data-name="Path 14086"
                        d="M40.323,15.228c3.864,0,6.778-1.388,6.778-3.228v3.873c0,1.84-2.915,3.228-6.778,3.228H40V15.224C40.107,15.228,40.213,15.228,40.323,15.228Z"
                        transform="translate(-27.424 -8.453)"
                        fill="#e6e9ed"
                      />
                      <path
                        id="Path_14087"
                        data-name="Path 14087"
                        d="M12.974,22h1.291v3.873H6.984A3.007,3.007,0,0,0,3.937,29.1l-.055.1A3.876,3.876,0,0,1,5.873,22h7.1Z"
                        transform="translate(-1.677 -15.228)"
                        fill="#e6e9ed"
                      />
                      <path
                        id="Path_14089"
                        data-name="Path 14089"
                        d="M35.582,8.228c1.448,0,2.582-.709,2.582-1.614S37.03,5,35.582,5,33,5.709,33,6.614,34.134,8.228,35.582,8.228Zm0-2.582c1.141,0,1.937.51,1.937.968s-.8.968-1.937.968-1.937-.51-1.937-.968S34.441,5.646,35.582,5.646Z"
                        transform="translate(-22.68 -3.709)"
                        fill="#404040"
                      />
                      <path
                        id="Path_14090"
                        data-name="Path 14090"
                        d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
                        transform="translate(-1 -1)"
                        fill="#404040"
                      />
                      <path
                        id="Path_14091"
                        data-name="Path 14091"
                        d="M45,47h.646v3.228H45Z"
                        transform="translate(-30.806 -32.164)"
                        fill="#404040"
                      />
                      <path
                        id="Path_14092"
                        data-name="Path 14092"
                        d="M41,47h.646v3.228H41Z"
                        transform="translate(-28.097 -32.164)"
                        fill="#404040"
                      />
                    </g>
                  </svg>

                  <span data-cy="select_size_statement" className="ml-[10px]">
                    {translateFunction("Please Select The Appropriate")}{" "}
                    <span data-cy="size_statement" className="medium ml-1">
                      {translateFunction("Size")}
                    </span>
                  </span>
                </div>
                <div
                  data-cy="countainer_ofSize_scroller"
                  className="flex-row h-[96px] w-full max-w-[420px] min-w-[420px] relative"
                >
                  <SliderRuler />

                  <StackedSlider
                    className="mt-[7px]"
                    initial_index={getInitialSizeSlider()}
                    slidesArray={ProductData?.choice_options?.[0]?.options}
                    max_drag={100}
                    slide_width={70}
                    onSlideChange={(index) => {
                      setSelectedSize(
                        ProductData?.choice_options?.[0]?.options?.[index]
                      );
                    }}
                    max_scale={1}
                    min_scale={0.7}
                    overlap_factor={1.1}
                    threshold={0.3}
                    renderSlide={({ index, isActive, slide_width }) => {
                      let size =
                        ProductData?.choice_options?.[0]?.options?.[index];
                      return (
                        <div
                          data-cy="size_slide"
                          key={index}
                          onClick={() => {
                            // @ts-ignore

                            setSelectedSize(size);
                            // Sendevent({
                            //   event: GA_EVENT_NAMES.CLICK,
                            //   value: GA_CLICK_EVENT_VALUES.SIZE_SLIDE,
                            // });
                          }}
                          style={{
                            overflow: "visible",
                            minWidth: "70px",
                            height: "70px",
                            boxShadow:
                              "inset rgba(255, 255, 255, 0.5) 0px 4px 6px, rgba(0, 0, 0, 0.1) 0px 3px 4px",
                            border: "#366cb8 1px solid",
                          }}
                          className={`${
                            getVariantSizeQty(size.option) === 0
                              ? isActive
                                ? "text-white bg-[#ff5f61]"
                                : "text-[#ff5f61] !bg-transparent border-none shadow-none"
                              : getVariantSizeQty(size.option) < 10
                              ? isActive
                                ? "text-white bg-[#ffaf5f]"
                                : "text-[#ffaf5f] !bg-transparent border-none shadow-none"
                              : isActive
                              ? ""
                              : "!bg-transparent !text-[#505050] !border-none !shadow-none"
                          } bg-[#505050] text-[#f8f8f8] rounded-full flex-row items-center justify-center text-[30px] bold select-none flex`}
                        >
                          {size.name}
                        </div>
                      );
                    }}
                  />
                </div>
                {getVariantSizeQty(selectedSize?.option) === 0 ? (
                  <div
                    data-cy="not_available_now"
                    className="flex-row items-center text-[12px] text-[#FF5F61] mt-[9px] medium [&>span]:ml-1"
                  >
                    <span data-cy="not_available_now_text">
                      {translateFunction(
                        "Not Available Now, Stock Is Sold Out"
                      )}{" "}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* @ts-ignore */}
                    {ProductData?.collected_after_ordering !== 1 && (
                      <div
                        data-cy="available_now_container"
                        className={
                          languageVariable === "ar"
                            ? "flex-row-rev items-center text-[12px] text-[#404040] mt-[9px] regular [&>span]:ml-1"
                            : "flex-row items-center text-[12px] text-[#404040] mt-[9px] regular [&>span]:ml-1"
                        }
                      >
                        <span data-cy="M_Text" className="bold">
                          M
                        </span>
                        <span data-cy="Recommended_Text">
                          {" "}
                          {translateFunction("Recommended")}{" "}
                        </span>
                        <span data-cy="Size_Text" className="bold">
                          {translateFunction("Size")}{" "}
                        </span>
                        <span data-cy="For_You_Text">
                          {" "}
                          {translateFunction("For You")}{" "}
                        </span>
                        {getVariantSizeQty(selectedSize?.option) < 10 && (
                          <>
                            <span
                              data-cy="Last_text"
                              className="text-[#FFAF5F]"
                            >
                              {translateFunction("Last")}{" "}
                            </span>
                            <span
                              data-cy="Last_text_number"
                              className="text-[#FFAF5F] meduim"
                            >
                              {getVariantSizeQty(selectedSize?.option)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div
                  data-cy="Need_help_container"
                  className="flex-row w-full mt-[10px]"
                >
                  <div
                    data-cy="Need_help_container_1"
                    className="flex bg-[#F8F8F8] rounded-[20px] h-[50px] text-[12px] text-[#505050] items-center justify-center w-full"
                  >
                    <svg
                      data-cy="Need_help_container_svg"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                    >
                      <g
                        id="Group_3656"
                        data-name="Group 3656"
                        transform="translate(-9.32)"
                      >
                        <g
                          id="Group_3653"
                          data-name="Group 3653"
                          transform="translate(9.32)"
                        >
                          <g id="Group_3130" data-name="Group 3130">
                            <g id="Group_3129" data-name="Group 3129">
                              <g id="Group_3128" data-name="Group 3128">
                                <g id="Group_3127" data-name="Group 3127">
                                  <g id="Group_3126" data-name="Group 3126">
                                    <g id="Group_3125" data-name="Group 3125">
                                      <g id="Group_3124" data-name="Group 3124">
                                        <g
                                          id="Group_712"
                                          data-name="Group 712"
                                          transform="translate(8.172 12.564)"
                                        >
                                          <path
                                            id="Path_14078"
                                            data-name="Path 14078"
                                            d="M34,42h5.311a1.061,1.061,0,0,1,1.062,1.062v4.957a1.061,1.061,0,0,1-1.062,1.062H34a.71.71,0,0,0,.708-.708V42.708A.713.713,0,0,0,34,42Z"
                                            transform="translate(-31.875 -42)"
                                            fill="#95ffe1"
                                          />
                                          <path
                                            id="Path_14079"
                                            data-name="Path 14079"
                                            d="M29.416,42.708v.708H28A1.416,1.416,0,0,1,29.416,42h.708A.71.71,0,0,0,29.416,42.708Z"
                                            transform="translate(-28 -42)"
                                            fill="#95ffe1"
                                          />
                                          <path
                                            id="Path_14080"
                                            data-name="Path 14080"
                                            d="M29.416,58.708a.713.713,0,0,0,.708.708h-.708A1.416,1.416,0,0,1,28,58h1.416Z"
                                            transform="translate(-28 -52.335)"
                                            fill="#95ffe1"
                                          />
                                        </g>
                                        <path
                                          id="Path_14081"
                                          data-name="Path 14081"
                                          d="M33.416,58v.708a.71.71,0,0,1-.708.708A.713.713,0,0,1,32,58.708V58Z"
                                          transform="translate(-22.067 -39.77)"
                                          fill="#37bc9b"
                                        />
                                        <path
                                          id="Path_14082"
                                          data-name="Path 14082"
                                          d="M33.416,42.708v.708H32v-.708A.71.71,0,0,1,32.708,42a.713.713,0,0,1,.708.708Z"
                                          transform="translate(-22.067 -28.863)"
                                          fill="#37bc9b"
                                        />
                                        <path
                                          id="Path_14083"
                                          data-name="Path 14083"
                                          d="M25.541,46h1.416v4.249H22V46h3.541Z"
                                          transform="translate(-15.419 -32.019)"
                                          fill="#ccd1d9"
                                        />
                                        <path
                                          id="Path_14084"
                                          data-name="Path 14084"
                                          d="M7.665,38.249H9.082V42.5H6.249A4.248,4.248,0,0,1,2,38.249V34a4.243,4.243,0,0,0,4.249,4.249Z"
                                          transform="translate(-1.646 -24.269)"
                                          fill="#ccd1d9"
                                        />
                                        <path
                                          id="Path_14085"
                                          data-name="Path 14085"
                                          d="M20,12c0,1.962,3.02,3.456,7.082,3.537v0H20Z"
                                          transform="translate(-14.156 -8.518)"
                                          fill="#fcd770"
                                        />
                                        <path
                                          id="Path_14086"
                                          data-name="Path 14086"
                                          d="M40.354,15.541c4.238,0,7.436-1.523,7.436-3.541v4.249c0,2.018-3.2,3.541-7.436,3.541H40V15.537C40.117,15.541,40.234,15.541,40.354,15.541Z"
                                          transform="translate(-28.145 -8.642)"
                                          fill="#e6e9ed"
                                        />
                                        <path
                                          id="Path_14087"
                                          data-name="Path 14087"
                                          d="M14.039,22h1.416v4.249H7.467A3.3,3.3,0,0,0,4.125,29.79l-.06.106A4.252,4.252,0,0,1,6.249,22h7.79Z"
                                          transform="translate(-1.646 -15.597)"
                                          fill="#e6e9ed"
                                        />
                                        <path
                                          id="Path_14088"
                                          data-name="Path 14088"
                                          d="M27.436,2c4.238,0,7.436,1.523,7.436,3.541s-3.2,3.541-7.436,3.541c-.12,0-.237,0-.354,0C23.02,9,20,7.5,20,5.541,20,3.523,23.2,2,27.436,2Z"
                                          transform="translate(-15.226 -1.646)"
                                          fill="#95ffe1"
                                        />
                                        <ellipse
                                          id="Ellipse_98"
                                          data-name="Ellipse 98"
                                          cx="3.023"
                                          cy="0.605"
                                          rx="3.023"
                                          ry="0.605"
                                          transform="translate(9.546 2.606)"
                                          fill="#37bc9b"
                                        />
                                        <path
                                          id="Path_14089"
                                          data-name="Path 14089"
                                          d="M35.833,8.541c1.588,0,2.833-.778,2.833-1.77S37.421,5,35.833,5,33,5.778,33,6.77,34.244,8.541,35.833,8.541Zm0-2.833c1.252,0,2.124.56,2.124,1.062s-.872,1.062-2.124,1.062-2.125-.56-2.125-1.062S34.581,5.708,35.833,5.708Z"
                                          transform="translate(-23.029 -3.584)"
                                          fill="#404040"
                                        />
                                        <path
                                          id="Path_14090"
                                          data-name="Path 14090"
                                          d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
                                          transform="translate(-1 -1)"
                                          fill="#404040"
                                        />
                                        <path
                                          id="Path_14091"
                                          data-name="Path 14091"
                                          d="M45,47h.646v3.228H45Z"
                                          transform="translate(-30.806 -32.164)"
                                          fill="#404040"
                                        />
                                        <path
                                          id="Path_14092"
                                          data-name="Path 14092"
                                          d="M41,47h.646v3.228H41Z"
                                          transform="translate(-28.097 -32.164)"
                                          fill="#404040"
                                        />
                                      </g>
                                    </g>
                                  </g>
                                </g>
                              </g>
                            </g>
                          </g>
                        </g>
                      </g>
                    </svg>

                    <span data-cy="Need_Help_text" className="ml-[10px]">
                      {translateFunction("Need Help Finding Your Size?")}
                    </span>
                  </div>
                  <div
                    data-cy="cyrcle_svg"
                    className="flex bg-[#F8F8F8] rounded-[20px] ml-[10px] h-[50px] items-center justify-center w-[69px]"
                  >
                    <svg
                      data-cy="cyrcle_svg_container"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                    >
                      <g
                        id="Mask_Group_370"
                        data-name="Mask Group 370"
                        clipPath="url(#clipPath)"
                      >
                        <g id="settings">
                          <g id="Group_11210" data-name="Group 11210">
                            <ellipse
                              id="Ellipse_268"
                              data-name="Ellipse 268"
                              cx="2.969"
                              cy="2.93"
                              rx="2.969"
                              ry="2.93"
                              transform="translate(7.031 7.051)"
                              fill="#8d8d8d"
                            />
                            <path
                              id="Path_21474"
                              data-name="Path 21474"
                              d="M17.07,8.223h-.035A1.1,1.1,0,0,1,16,7.521a1.143,1.143,0,0,1,.263-1.274.586.586,0,0,0,0-.824L14.6,3.766a.636.636,0,0,0-.854.025,1.1,1.1,0,0,1-1.231.239,1.168,1.168,0,0,1-.754-1.08.586.586,0,0,0-.586-.586H8.828a.617.617,0,0,0-.586.621A1.134,1.134,0,0,1,7.5,4.024a1.147,1.147,0,0,1-1.273-.263.585.585,0,0,0-.824,0L3.746,5.423a.617.617,0,0,0,.025.854A1.1,1.1,0,0,1,4.01,7.507a1.141,1.141,0,0,1-1.08.715.586.586,0,0,0-.586.586v2.344a.617.617,0,0,0,.621.586,1.1,1.1,0,0,1,1.039.7,1.142,1.142,0,0,1-.263,1.273.586.586,0,0,0,0,.824L5.4,16.2a.636.636,0,0,0,.854-.025,1.093,1.093,0,0,1,1.231-.239,1.226,1.226,0,0,1,.754,1.119.586.586,0,0,0,.586.586h2.344a.617.617,0,0,0,.586-.621,1.186,1.186,0,0,1,.742-1.078,1.14,1.14,0,0,1,1.273.263.585.585,0,0,0,.824,0l1.657-1.657a.617.617,0,0,0-.025-.854,1.118,1.118,0,0,1-.24-1.23,1.151,1.151,0,0,1,1.081-.716.586.586,0,0,0,.586-.586V8.809a.586.586,0,0,0-.586-.586ZM10,14.082a4.1,4.1,0,1,1,4.141-4.1A4.14,4.14,0,0,1,10,14.082Z"
                              fill="#8d8d8d"
                            />
                          </g>
                          <path
                            id="Path_21475"
                            data-name="Path 21475"
                            d="M18.612,6.14a.586.586,0,0,0-.343.755,8.744,8.744,0,0,1,.559,3.086A8.825,8.825,0,0,1,3.735,16.2a.586.586,0,0,0-1,.414v1.658a.586.586,0,0,0,1.172,0V17.9A9.992,9.992,0,0,0,20,9.98a9.918,9.918,0,0,0-.633-3.5.588.588,0,0,0-.755-.343Z"
                            fill="#505050"
                          />
                          <path
                            id="Path_21476"
                            data-name="Path 21476"
                            d="M16.681,1.108a.612.612,0,0,0-.586.585v.372A10.026,10.026,0,0,0,0,9.98a9.918,9.918,0,0,0,.633,3.5.586.586,0,0,0,1.1-.412A8.744,8.744,0,0,1,1.172,9.98,8.848,8.848,0,0,1,16.263,3.769a.586.586,0,0,0,1-.413l0-1.661a.586.586,0,0,0-.585-.587Z"
                            fill="#505050"
                          />
                        </g>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shouldShowNotifyButton() ? (
            <NotifyCartButton
              isNotified={getSelectedVariantQty()?.variant_notify_for_user}
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
              selected_variant={getSelectedVariantQty()?.type}
              id={ProductData?.id}
            />
          ) : (
            <AddToCartButton
              updateQuantity={async (type, qty) => updateQuantity(type, qty)}
              loading={requestLoading}
              setLoading={setRequestLoading}
              selectedVariant={getSelectedVariantQty()}
              product={ProductData}
              color={selectedColor}
              size={selectedSize}
              id={ProductData?.id}
              qty={getSelectedVariantQty()?.qty}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AddToCartComponent;
const SizesSkeleton = ({ product }) => {
  const { currency } = useAppStore();
  return (
    <div className="product-details-footer z-[9999] min-h-[100px] h-auto">
      <div className="product-info-container">
        <div className="product-info-price">
          {
            <div className="product-old-price">
              <Skeleton width={30} height={10} />
            </div>
          }
          <div className="product-new-price">
            <Skeleton width={30} height={10} />
          </div>
          <div className="product-currency">
            {currency?.symbol ?? (
              <Skeleton
                containerClassName="flex items-center"
                className="flex items-center"
                width={20}
                height={10}
              />
            )}
          </div>
          <div className="info-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <g
                id="Group_10807"
                data-name="Group 10807"
                transform="translate(-65 -464)"
              >
                <g
                  id="Group_10756"
                  data-name="Group 10756"
                  transform="translate(65 464)"
                >
                  <path
                    id="Subtraction_1"
                    data-name="Subtraction 1"
                    d="M.262,9.636a.258.258,0,0,1-.156-.054.29.29,0,0,1-.1-.3L.675,7.091A4.792,4.792,0,0,1,0,4.636,4.554,4.554,0,0,1,4.458,0,4.554,4.554,0,0,1,8.914,4.636,4.555,4.555,0,0,1,4.458,9.273a4.341,4.341,0,0,1-2.5-.794L.409,9.589A.238.238,0,0,1,.262,9.636ZM4.416,6.982a.571.571,0,1,0,.562.571A.558.558,0,0,0,4.416,6.982Zm.115-4.55a.879.879,0,0,1,.954.88c0,.432-.183.7-.7,1.023a1.433,1.433,0,0,0-.817,1.288v.1c0,.319.171.518.447.518.255,0,.4-.162.426-.469.021-.445.181-.669.714-1a1.684,1.684,0,0,0-.987-3.16A1.8,1.8,0,0,0,2.812,2.6a1.186,1.186,0,0,0-.115.518.386.386,0,0,0,.413.434c.224,0,.349-.108.43-.372A.951.951,0,0,1,4.531,2.432Z"
                    transform="translate(0 2.364)"
                    fill="#8e8e8e"
                  />
                  <path
                    id="Path_21380"
                    data-name="Path 21380"
                    d="M10.677,9.661a.259.259,0,0,1-.157.055.237.237,0,0,1-.147-.047L8.824,8.559l-.017.011a5.314,5.314,0,0,0,.4-2.036A5.089,5.089,0,0,0,4.227,1.352a4.724,4.724,0,0,0-1.094.127A4.326,4.326,0,0,1,6.325.079a4.555,4.555,0,0,1,4.457,4.636,4.778,4.778,0,0,1-.675,2.455l.664,2.189a.287.287,0,0,1-.094.3Z"
                    transform="translate(0.23 0.466)"
                    fill="#8e8e8e"
                  />
                  <rect
                    id="Rectangle_4714"
                    data-name="Rectangle 4714"
                    width="11.536"
                    height="12"
                    transform="translate(0.464)"
                    fill="none"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>
        <div className="product-info-properties">
          <div className="product-prop-item">
            {translateFunction("All Inclusive Without Additions")}
          </div>
          {product?.shipping_cost === 0 && (
            <div className="product-prop-item">
              <img
                width={15}
                height={15}
                alt="truck"
                src="/svg/greentruck.svg"
              />
              <span data-cy="free_shipping_text">
                {translateFunction("Free Shipping")}
              </span>
            </div>
          )}
          <div className="product-prop-item">
            <img width={15} height={15} alt="truck" src="/svg/redtruck.svg" />
            <span data-cy="free_shipping_text2">
              {translateFunction("Free Return")}
            </span>
          </div>
          <div className="product-prop-item">
            <img
              width={10}
              height={15}
              alt="deliveryman"
              src="/svg/deliveryman.svg"
            />
            <span data-cy="free_shipping_text3">
              {translateFunction("Ship To You Accepted")}{" "}
              {translateFunction("2 June")}
            </span>
          </div>
        </div>
      </div>
      <div className="Extended-area-product">
        <svg
          className="border-svg"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="1.7"
        >
          <line
            id="Line_1104"
            data-name="Line 1104"
            x2="100%"
            y2="1"
            transform="translate(0.001 0.35)"
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="0.7"
          />
        </svg>
        <div className="flex-col items-center justify-center w-full h-[245px] regular text-[14px] text-[#505050] pl-5 pr-5">
          <div className="flex-row items-center">
            <svg
              id="Group_3644"
              data-name="Group 3644"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <g id="Group_3124" data-name="Group 3124">
                <path
                  id="Path_14086"
                  data-name="Path 14086"
                  d="M40.323,15.228c3.864,0,6.778-1.388,6.778-3.228v3.873c0,1.84-2.915,3.228-6.778,3.228H40V15.224C40.107,15.228,40.213,15.228,40.323,15.228Z"
                  transform="translate(-27.424 -8.453)"
                  fill="#e6e9ed"
                />
                <path
                  id="Path_14087"
                  data-name="Path 14087"
                  d="M12.974,22h1.291v3.873H6.984A3.007,3.007,0,0,0,3.937,29.1l-.055.1A3.876,3.876,0,0,1,5.873,22h7.1Z"
                  transform="translate(-1.677 -15.228)"
                  fill="#e6e9ed"
                />
                <path
                  id="Path_14089"
                  data-name="Path 14089"
                  d="M35.582,8.228c1.448,0,2.582-.709,2.582-1.614S37.03,5,35.582,5,33,5.709,33,6.614,34.134,8.228,35.582,8.228Zm0-2.582c1.141,0,1.937.51,1.937.968s-.8.968-1.937.968-1.937-.51-1.937-.968S34.441,5.646,35.582,5.646Z"
                  transform="translate(-22.68 -3.709)"
                  fill="#404040"
                />
                <path
                  id="Path_14090"
                  data-name="Path 14090"
                  d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
                  transform="translate(-1 -1)"
                  fill="#404040"
                />
                <path
                  id="Path_14091"
                  data-name="Path 14091"
                  d="M45,47h.646v3.228H45Z"
                  transform="translate(-30.806 -32.164)"
                  fill="#404040"
                />
                <path
                  id="Path_14092"
                  data-name="Path 14092"
                  d="M41,47h.646v3.228H41Z"
                  transform="translate(-28.097 -32.164)"
                  fill="#404040"
                />
              </g>
            </svg>

            <span className="ml-[10px]">
              {translateFunction("Please Select The Appropriate")}{" "}
              <span className="medium ml-1"> {translateFunction("Size")}</span>
            </span>
          </div>
          <div className="flex-col items-center h-[96px] w-full max-w-[420px] min-w-[420px] relative">
            <div className="flex-row justify-center w-full">
              {Array.from({ length: 6 }).map((s, i) => (
                <Skeleton
                  key={i}
                  containerClassName="h-20 items-center flex-row"
                  className="w-20 h-20 rounded-full ml-2 items-center flex-row"
                />
              ))}
            </div>
            <div
              className={
                "flex-row items-center text-[12px] text-[#404040] mt-[9px] regular [&>span]:ml-1"
              }
            >
              <Skeleton width={200} height={20} />
            </div>
            <div className="flex-row w-full mt-[10px]">
              <div className="flex bg-[#F8F8F8] rounded-[20px] h-[50px] text-[12px] text-[#505050] items-center justify-center w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                >
                  <g
                    id="Group_3656"
                    data-name="Group 3656"
                    transform="translate(-9.32)"
                  >
                    <g
                      id="Group_3653"
                      data-name="Group 3653"
                      transform="translate(9.32)"
                    >
                      <g id="Group_3130" data-name="Group 3130">
                        <g id="Group_3129" data-name="Group 3129">
                          <g id="Group_3128" data-name="Group 3128">
                            <g id="Group_3127" data-name="Group 3127">
                              <g id="Group_3126" data-name="Group 3126">
                                <g id="Group_3125" data-name="Group 3125">
                                  <g id="Group_3124" data-name="Group 3124">
                                    <g
                                      id="Group_712"
                                      data-name="Group 712"
                                      transform="translate(8.172 12.564)"
                                    >
                                      <path
                                        id="Path_14078"
                                        data-name="Path 14078"
                                        d="M34,42h5.311a1.061,1.061,0,0,1,1.062,1.062v4.957a1.061,1.061,0,0,1-1.062,1.062H34a.71.71,0,0,0,.708-.708V42.708A.713.713,0,0,0,34,42Z"
                                        transform="translate(-31.875 -42)"
                                        fill="#95ffe1"
                                      />
                                      <path
                                        id="Path_14079"
                                        data-name="Path 14079"
                                        d="M29.416,42.708v.708H28A1.416,1.416,0,0,1,29.416,42h.708A.71.71,0,0,0,29.416,42.708Z"
                                        transform="translate(-28 -42)"
                                        fill="#95ffe1"
                                      />
                                      <path
                                        id="Path_14080"
                                        data-name="Path 14080"
                                        d="M29.416,58.708a.713.713,0,0,0,.708.708h-.708A1.416,1.416,0,0,1,28,58h1.416Z"
                                        transform="translate(-28 -52.335)"
                                        fill="#95ffe1"
                                      />
                                    </g>
                                    <path
                                      id="Path_14081"
                                      data-name="Path 14081"
                                      d="M33.416,58v.708a.71.71,0,0,1-.708.708A.713.713,0,0,1,32,58.708V58Z"
                                      transform="translate(-22.067 -39.77)"
                                      fill="#37bc9b"
                                    />
                                    <path
                                      id="Path_14082"
                                      data-name="Path 14082"
                                      d="M33.416,42.708v.708H32v-.708A.71.71,0,0,1,32.708,42a.713.713,0,0,1,.708.708Z"
                                      transform="translate(-22.067 -28.863)"
                                      fill="#37bc9b"
                                    />
                                    <path
                                      id="Path_14083"
                                      data-name="Path 14083"
                                      d="M25.541,46h1.416v4.249H22V46h3.541Z"
                                      transform="translate(-15.419 -32.019)"
                                      fill="#ccd1d9"
                                    />
                                    <path
                                      id="Path_14084"
                                      data-name="Path 14084"
                                      d="M7.665,38.249H9.082V42.5H6.249A4.248,4.248,0,0,1,2,38.249V34a4.243,4.243,0,0,0,4.249,4.249Z"
                                      transform="translate(-1.646 -24.269)"
                                      fill="#ccd1d9"
                                    />
                                    <path
                                      id="Path_14085"
                                      data-name="Path 14085"
                                      d="M20,12c0,1.962,3.02,3.456,7.082,3.537v0H20Z"
                                      transform="translate(-14.156 -8.518)"
                                      fill="#fcd770"
                                    />
                                    <path
                                      id="Path_14086"
                                      data-name="Path 14086"
                                      d="M40.354,15.541c4.238,0,7.436-1.523,7.436-3.541v4.249c0,2.018-3.2,3.541-7.436,3.541H40V15.537C40.117,15.541,40.234,15.541,40.354,15.541Z"
                                      transform="translate(-28.145 -8.642)"
                                      fill="#e6e9ed"
                                    />
                                    <path
                                      id="Path_14087"
                                      data-name="Path 14087"
                                      d="M14.039,22h1.416v4.249H7.467A3.3,3.3,0,0,0,4.125,29.79l-.06.106A4.252,4.252,0,0,1,6.249,22h7.79Z"
                                      transform="translate(-1.646 -15.597)"
                                      fill="#e6e9ed"
                                    />
                                    <path
                                      id="Path_14088"
                                      data-name="Path 14088"
                                      d="M27.436,2c4.238,0,7.436,1.523,7.436,3.541s-3.2,3.541-7.436,3.541c-.12,0-.237,0-.354,0C23.02,9,20,7.5,20,5.541,20,3.523,23.2,2,27.436,2Z"
                                      transform="translate(-15.226 -1.646)"
                                      fill="#95ffe1"
                                    />
                                    <ellipse
                                      id="Ellipse_98"
                                      data-name="Ellipse 98"
                                      cx="3.023"
                                      cy="0.605"
                                      rx="3.023"
                                      ry="0.605"
                                      transform="translate(9.546 2.606)"
                                      fill="#37bc9b"
                                    />
                                    <path
                                      id="Path_14089"
                                      data-name="Path 14089"
                                      d="M35.833,8.541c1.588,0,2.833-.778,2.833-1.77S37.421,5,35.833,5,33,5.778,33,6.77,34.244,8.541,35.833,8.541Zm0-2.833c1.252,0,2.124.56,2.124,1.062s-.872,1.062-2.124,1.062-2.125-.56-2.125-1.062S34.581,5.708,35.833,5.708Z"
                                      transform="translate(-23.029 -3.584)"
                                      fill="#404040"
                                    />
                                    <path
                                      id="Path_14090"
                                      data-name="Path 14090"
                                      d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
                                      transform="translate(-1 -1)"
                                      fill="#404040"
                                    />
                                    <path
                                      id="Path_14091"
                                      data-name="Path 14091"
                                      d="M45,47h.708v3.541H45Z"
                                      transform="translate(-30.852 -32.665)"
                                      fill="#404040"
                                    />
                                    <path
                                      id="Path_14092"
                                      data-name="Path 14092"
                                      d="M41,47h.708v3.541H41Z"
                                      transform="translate(-28.139 -32.665)"
                                      fill="#404040"
                                    />
                                  </g>
                                </g>
                              </g>
                            </g>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>

                <span className="ml-[10px]">
                  {translateFunction("Need Help Finding Your Size?")}
                </span>
              </div>
              <div className="flex bg-[#F8F8F8] rounded-[20px] ml-[10px] h-[50px] items-center justify-center w-[69px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                >
                  <g
                    id="Mask_Group_370"
                    data-name="Mask Group 370"
                    clipPath="url(#clipPath)"
                  >
                    <g id="settings">
                      <g id="Group_11210" data-name="Group 11210">
                        <ellipse
                          id="Ellipse_268"
                          data-name="Ellipse 268"
                          cx="2.969"
                          cy="2.93"
                          rx="2.969"
                          ry="2.93"
                          transform="translate(7.031 7.051)"
                          fill="#8d8d8d"
                        />
                        <path
                          id="Path_21474"
                          data-name="Path 21474"
                          d="M17.07,8.223h-.035A1.1,1.1,0,0,1,16,7.521a1.143,1.143,0,0,1,.263-1.274.586.586,0,0,0,0-.824L14.6,3.766a.636.636,0,0,0-.854.025,1.1,1.1,0,0,1-1.231.239,1.168,1.168,0,0,1-.754-1.08.586.586,0,0,0-.586-.586H8.828a.617.617,0,0,0-.586.621A1.134,1.134,0,0,1,7.5,4.024a1.147,1.147,0,0,1-1.273-.263.585.585,0,0,0-.824,0L3.746,5.423a.617.617,0,0,0,.025.854A1.1,1.1,0,0,1,4.01,7.507a1.141,1.141,0,0,1-1.08.715.586.586,0,0,0-.586.586v2.344a.617.617,0,0,0,.621.586,1.1,1.1,0,0,1,1.039.7,1.142,1.142,0,0,1-.263,1.273.586.586,0,0,0,0,.824L5.4,16.2a.636.636,0,0,0,.854-.025,1.093,1.093,0,0,1,1.231-.239,1.226,1.226,0,0,1,.754,1.119.586.586,0,0,0,.586.586h2.344a.617.617,0,0,0,.586-.621,1.186,1.186,0,0,1,.742-1.078,1.14,1.14,0,0,1,1.273.263.585.585,0,0,0,.824,0l1.657-1.657a.617.617,0,0,0-.025-.854,1.118,1.118,0,0,1-.24-1.23,1.151,1.151,0,0,1,1.081-.716.586.586,0,0,0,.586-.586V8.809a.586.586,0,0,0-.586-.586ZM10,14.082a4.1,4.1,0,1,1,4.141-4.1A4.14,4.14,0,0,1,10,14.082Z"
                          fill="#8d8d8d"
                        />
                      </g>
                      <path
                        id="Path_21475"
                        data-name="Path 21475"
                        d="M18.612,6.14a.586.586,0,0,0-.343.755,8.744,8.744,0,0,1,.559,3.086A8.825,8.825,0,0,1,3.735,16.2a.586.586,0,0,0-1,.414v1.658a.586.586,0,0,0,1.172,0V17.9A9.992,9.992,0,0,0,20,9.98a9.918,9.918,0,0,0-.633-3.5.588.588,0,0,0-.755-.343Z"
                        fill="#505050"
                      />
                      <path
                        id="Path_21476"
                        data-name="Path 21476"
                        d="M16.681,1.108a.612.612,0,0,0-.586.585v.372A10.026,10.026,0,0,0,0,9.98a9.918,9.918,0,0,0,.633,3.5.586.586,0,0,0,1.1-.412A8.744,8.744,0,0,1,1.172,9.98,8.848,8.848,0,0,1,16.263,3.769a.586.586,0,0,0,1-.413l0-1.661a.586.586,0,0,0-.585-.587Z"
                        fill="#505050"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="product-options-container z-[9999999999999999] bg-white">
        <div className="add-cart-button animate-expandWidth z-[9999999999] flex justify-center items-center">
          <AddCartIcon />
          <Spinner />
        </div>
      </div>
    </div>
  );
};
const AddToCartButton = ({
  color,
  size,
  qty,
  id,
  product,
  updateQuantity,
  selectedVariant,
  loading,
  setLoading,
}) => {
  const { localCart, currency } = useAppStore();
  const getTotalQuantity = () => {
    let num = 0;
    localCart?.map((s) => {
      if (s.id == id) num = num + s.quantity;
    });
    return num;
  };
  const productInCart = () => {
    return localCart.filter((s) => s.id === id);
  };
  const showImagesOfProductInCart = () => {
    let cart_of_product = localCart.filter((s) => s.id === id);
    return cart_of_product?.map((s, key) => {
      return Array(s.quantity)
        .fill(1)
        .map((num, index) => {
          return (
            <img
              src={getConfiguredImage({
                src: GetImageUrl(s.image),
                width: 50,
                height: 50,
              })}
              id={`img${index}`}
              key={`${index}-${s.id}`}
              className="rounded-md w-8 h-8 static"
            />
          );
        });
    });
  };
  const isVariantInCart = ({ exact }) => {
    if (product?.variation?.length === 0)
      return localCart?.find((s) => s.id === id);

    if (
      localCart.find(
        (s) =>
          s.id === id &&
          (s.color === color?.color_option ||
            s.color ===
              product?.colors?.find((cl) => cl.option === color?.color_option)
                ?.color) &&
          s.size === size?.option
      )
    )
      return localCart.find(
        (s) =>
          s.id === id &&
          (s.color === color?.color_option ||
            s.color ===
              product?.colors?.find((cl) => cl.option === color?.color_option)
                ?.color) &&
          s.size === size?.option
      );
    if (exact) return localCart?.find((s) => s.id === id);
  };
  const clickHandler = async ({ variant }) => {
    try {
      setLoading(true);

      if (isVariantInCart({ exact: false })) {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.INCREASE_QTY_IN_ADD_TO_CART_WIDGET,
        // });
        await cart.UpdateCart({
          cart_id: isVariantInCart({ exact: false })?.item_id,
          qty: (isVariantInCart({ exact: false })?.quantity ?? 0) + 1,
          isFromAddWidget: true,
        });
        GAevent({
          action: GA_EVENT_NAMES.ADD_TO_CART,
          params: {
            currency: currency?.code,
            value: RoundPrice({
              num: selectedVariant?.offer_price,
              rate: currency?.exchange_rate,
              returnNumber: true,
              language: languageVariable,
            }),
            items: [
              {
                item_id: id,
                item_name: product?.name,
                price: RoundPrice({
                  num: selectedVariant?.offer_price,
                  rate: currency?.exchange_rate,
                  returnNumber: true,
                  language: languageVariable,
                }),
                quantity:
                  (isVariantInCart({ exact: false })?.quantity ?? 0) + 1,
                brand: product?.brand?.name,
                category: product?.category_name,
                count_likes: product?.count_of_likes,
                review_count: product?.shared_count,
                item_variant: selectedVariant?.type,
              },
            ],
            interaction_type: "add_to_cart",
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
          },
        });
        await updateQuantity();
      } else {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.ADD_TO_CART_BUTTON,
        // });
        await cart.AddToCart({
          product_id: id,
          color: product?.colors?.find((s) => s.option === color?.color_option)
            ?.color,
          choice_1: size?.option,
          qty: 1,
          image:
            color?.images[0]?.file_path ||
            color?.images[0] ||
            product?.images[0]?.file_path ||
            product?.images[0],
          isFromAddWidget: true,
        });
        GAevent({
          action: GA_EVENT_NAMES.ADD_TO_CART,
          params: {
            currency: currency?.code,
            value: RoundPrice({
              num: selectedVariant?.offer_price,
              rate: currency?.exchange_rate,
              returnNumber: true,
              language: languageVariable,
            }),
            items: [
              {
                item_id: id,
                item_name: product?.name,
                price: RoundPrice({
                  num: selectedVariant?.offer_price,
                  rate: currency?.exchange_rate,
                  returnNumber: true,
                  language: languageVariable,
                }),
                quantity: 1,
                brand: product?.brand?.name,
                category: product?.category_name,
                count_likes: product?.count_of_likes,
                review_count: product?.shared_count,
                item_variant: selectedVariant?.type,
              },
            ],
            interaction_type: "add_to_cart",
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
          },
        });
        await updateQuantity();
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const decreaseHandler = async ({ variant }) => {
    try {
      if (isVariantInCart({ exact: true })?.quantity > 1) {
        setLoading(true);
        await cart.UpdateCart({
          cart_id: isVariantInCart({ exact: true })?.item_id,
          qty: isVariantInCart({ exact: true })?.quantity - 1,
          isFromAddWidget: true,
        });
        await updateQuantity();
        setLoading(false);
      }
      if (isVariantInCart({ exact: true })?.quantity === 1) {
        setLoading(true);
        await cart.RemoveFromCart({
          cart_item: isVariantInCart({ exact: true }),
          isFromAddWidget: true,
        });
        GAevent({
          action: GA_EVENT_NAMES.REMOVE_FROM_CART,
          params: {
            items: [
              {
                item_id: product.id,
                item_name: product.name,
                item_variant: variant?.type,
                quantity: 1,
                price: RoundPrice({
                  num: variant?.offer_price,
                  rate: currency?.exchange_rate,
                  returnNumber: true,
                  language: languageVariable,
                }),
              },
            ],
          },
        });
        await updateQuantity();
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };
  const { lang } = useParams();
  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  const showAddToCartText = () => {
    if (languageVariable === "ar") {
      return `${translateFunction("Add To Bag")} ${
        color ? `${translateFunction("color")} ${color?.color_name}  ` : ""
      }  ${size ? `${translateFunction("Size")} ${size?.name}  ` : ""}`;
    } else {
      return `${translateFunction("Add To Bag")} ${
        color ? `${translateFunction("color")} ${color?.color_name}  ` : ""
      }  ${size ? `${translateFunction("Size")} ${size?.name}  ` : ""}`;
    }
  };
  return (
    <div
      data-cy="addto_cartButton_container"
      className="product-options-container z-[9999999999999999] bg-white"
    >
      <div
        data-cy="addTo_cart_button"
        className={`add-cart-button transition-all duration-300 ease-in-out extended-add-to-cart ${
          loading && "opacity-40 scale-95"
        }`}
        onClick={(e) => {
          // @ts-ignore
          if (e.target.closest(".minuse-qty-icon")) return;
          if (!loading) {
            clickHandler({ variant: selectedVariant });
          }
        }}
      >
        {qty > 0 && (
          <img
            data-cy="plus_image"
            src={"/svg/plusCart.svg"}
            className="plus-icon-button"
          />
        )}

        {productInCart()?.length > 0 && (
          <span
            data-cy="minus_icon_container"
            className="absolute minuse-qty-icon top-0 left-0 rounded-2xl bg-white flex justify-center items-center p-2 plus-icon-button"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.DECREASE_QTY_IN_ADD_TO_CART_WIDGET,
              // });
              decreaseHandler({ variant: selectedVariant });
            }}
          >
            <svg
              data-cy="minus_icon_svg"
              xmlns="http://www.w3.org/2000/svg"
              width="15.002"
              height="3.188"
              viewBox="0 0 15.002 3.188"
            >
              <path
                id="Path_21462"
                data-name="Path 21462"
                d="M2.1,2.165A1.567,1.567,0,0,1,.942,1.7,1.573,1.573,0,0,1,.48.544,1.479,1.479,0,0,1,.942-.586,1.623,1.623,0,0,1,2.1-1.02H13.862a1.594,1.594,0,0,1,1.156.449A1.525,1.525,0,0,1,15.48.573a1.525,1.525,0,0,1-.462,1.144,1.594,1.594,0,0,1-1.156.449Z"
                transform="translate(-0.479 1.021)"
                fill="#505050"
              />
            </svg>
          </span>
        )}

        <div data-cy="cart_icon_and_statment" className="button-desc">
          <div
            data-cy="cart_ic0n_container"
            className={`flex-row justify-end relative image-container-cart pr-[0px] max-w-[30px]`}
          >
            {showImagesOfProductInCart()}
            {getTotalQuantity() > 0 && !loading && (
              <span
                data-cy="quantity_added_toCart"
                className="bg-green-500 text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center "
              >
                {getTotalQuantity()}
              </span>
            )}
            {/* {product?.is_active === false ||
          product.is_country_restricted ||
          allVarIsEmpty() ? (
            <NotifySVG className={`mr-[15px]`} />
          ) : (
          <></>
          )} */}
            <AddCartIcon />
            {loading && <Spinner isMargen={true} />}
          </div>
          <span
            data-cy="cart_statment"
            className={`${languageVariable === "ar" ? "dir-rtl" : ""} mt-1`}
          >
            {showAddToCartText()}
          </span>
        </div>
      </div>
    </div>
  );
};
const NotifyCartButton = ({ isNotified, setNotify, selected_variant, id }) => {
  const NotifyAction = async () => {
    if (typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission();
    }
    if (!isNotified) {
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.NOTIFY_ME_BUTTON,
      // });
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
    <div
      data-cy="notify_container"
      className={`product-options-container z-[9999999999999999] bg-white`}
    >
      <div
        data-cy="notify_container_2"
        className={`add-cart-button flex-col extended-add-to-cart z-[9999999999] flex justify-center items-center ${
          !isNotified ? "bg-[#E6F1FF]" : "bg-[#FFFCE6]"
        }`}
        onClick={() => {
          NotifyAction();
        }}
      >
        <NotifySVG data-cy="notify_svg" className={`mr-[15px]`} />
        <div data-cy="notify_statement" className="button-desc">
          <div
            data-cy="notify_statement_1"
            className={`flex-row  justify-end relative image-container-cart pr-0`}
          >
            <span data-cy="notify_statement_2" className="mt-1">
              {isNotified
                ? translateFunction("We Will Inform You When this Is Available")
                : translateFunction("Notify Me When Product Is Available")}{" "}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
const AddCartIcon = () => {
  return (
    <svg
      data-cy="cart_icon_when_addToCart"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="30"
      height="30"
      viewBox="0 0 30 30"
    >
      <g
        id="Group_335"
        data-name="Group 335"
        transform="translate(0.568 -0.194)"
      >
        <g
          id="Group_11014"
          data-name="Group 11014"
          transform="translate(1.192 0.364)"
        >
          <g id="Group_4037" data-name="Group 4037" transform="translate(0 0)">
            <g id="Group_4033" data-name="Group 4033">
              <g id="Group_4032" data-name="Group 4032">
                <path
                  id="Path_15859"
                  data-name="Path 15859"
                  d="M1.077-.921H18.9l3.368,18.583s-1.685,2.585-2.655,2.585c-.735,0-13.582.424-19.695-.325-1.612-.2-2.174-2.257-2.174-2.257Z"
                  transform="translate(2.798 9.169)"
                  fill="#505050"
                />
                <g id="bag-5">
                  <g id="Group_2946" data-name="Group 2946">
                    <path
                      id="Path_15168"
                      data-name="Path 15168"
                      d="M33.579,43.2H51.922a3.585,3.585,0,0,0,3.58-3.58.38.38,0,0,0-.006-.068L52.519,22.745a1.976,1.976,0,0,0-1.961-1.673H48.413V19.036a5.662,5.662,0,1,0-11.324,0v2.034H34.944a1.976,1.976,0,0,0-1.962,1.674L30.005,39.556a.386.386,0,0,0-.006.068A3.585,3.585,0,0,0,33.579,43.2Zm4.29-24.168a4.881,4.881,0,0,1,9.762,0v2.034H37.87Zm-4.117,3.841v-.006a1.2,1.2,0,0,1,1.193-1.018h2.145v3.089a.391.391,0,1,0,.781,0v-3.09h9.762v3.089a.391.391,0,1,0,.781,0V21.852h2.145A1.2,1.2,0,0,1,51.75,22.87v.008l2.972,16.779a2.8,2.8,0,0,1-2.8,2.766H33.579a2.8,2.8,0,0,1-2.8-2.766Z"
                      transform="translate(-29.999 -13.374)"
                      fill="#505050"
                    />
                  </g>
                </g>
              </g>
              <path
                id="Path_15172"
                data-name="Path 15172"
                d="M0,0S3.125,2.668,6.479,2.668,13.414,0,13.414,0"
                transform="translate(6.044 19.49)"
                fill="none"
                stroke="#ffe836"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
