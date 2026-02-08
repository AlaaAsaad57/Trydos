"use client";
import { useEffect, useState } from "react";
import {
  getCart,
  getOldCart,
  RoundPrice,
  translateFunction,
  GetCartOreview,
  LogError,
} from "utils/functions";

import Skeleton from "react-loading-skeleton";
import "styles/productDetails.css";
import NextLink from "components/global/NextLink";
import { useParams, usePathname } from "next/navigation";
import OrderButton from "./OrderButton";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import cartService from "services/cart";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { EnableScroll } from "utils/tinyUtils";

import { fetchData } from "utils/fetchData";
import { useRouter } from "next/navigation";
import { REQUESTS_DATA } from "utils/Requests";
import auth from "services/auth";
import CartErrorComponent from "./CartErrorComponent";
import OldCartContainer from "./OldCartContainer";
import CartItem from "./CartItem";
import Image from "next/image";
import EmptyCart from "./EmptyCart";
import { isSamePage } from "utils/navigationsUtils";
import CheckoutButton from "./CheckoutButton";

function CartContainer({ close, toOrders }) {
  const {
    storeOldCart,
    hideOldCart,
    initCart,
    removeFromCart,
    setCartLoading,
    setOrderData,

    getProductDetailsForCart,
    setActiveColorDetails,
    language,
    cart_loading,
    cart,
    cartShippingSuccess,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,

        screen_path: window.location.pathname,
      },
    });
    setCartLoading(true);
    getData();
    setOrderData({
      payment: [],
      coupon: false,
      agree: false,
      coupon_number: "",
      loading: false,
      success: false,
      data: [],
    });
  }, []);
  const getData = async () => {
    let data = await getCart({
      callback: ([data, res]) => {
        initCart(data ?? { cart: [] });
      },
    });
    setCartLoading(false);

    if (data?.cart?.length > 0) {
      GAevent({
        action: GA_EVENT_NAMES.VIEW_CART,
        params: {
          items: data.cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,
            price: item.offer_price,
            quantity: item.quantity,
            item_variant: item.product_variation_id ?? "N/A",
          })),
          screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
          screen_path: window.location.pathname,
        },
      });
    }
  };

  const handleRetry = async () => {
    setCartLoading(true);
    await getData();
  };
  const params = useParams();
  const updateDataForProduct = async (slug) => {
    if (params?.productId === slug) {
      try {
        let response = await fetchData({
          url: "/web/product/qtyPriceDetails" + `/${slug}`,
          reqTitle: REQUESTS_DATA.GET_PRODUCT_VRIANTES,
          method: "GET",
          server: "market",
        });
        // @ts-ignore
        if (!response.success) {
          throw new Error(response.message);
        }
        getProductDetailsForCart(response.data);
      } catch (err) {
        LogError({
          error: err,
          scenario: "updateDataForProduct in cart widget",
          slug,
        });
      }
    }
  };

  const RemoveFromCartAction = async (product) => {
    removeFromCart(product.id);
    await cartService.RemoveFromCart({
      cart_item: { ...product, item_id: product.id },
    });
    await GetCartOreview();
    await updateDataForProduct(product.slug);
  };

  // Retrieve shipping_duration_days from sessionStorage

  // Filter oldCart to exclude products that are in the current cart (with the same variation)

  return (
    <div
      className={`flex-col ${
        cart.length > 0 ? "pb-[283px]" : "100px"
      }   top-0 left-0 min-h-screen max-h-full h-auto overflow-hidden w-full bg-[#ffffff] min-w-screen z-9999999999 pt-1`}
      data-cy="cartPage-container"
    >
      <div
        className="flex-col pl-2 pr-2 bg-white p-1"
        data-cy="cartPage-header-container"
      >
        <div
          className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center "
          data-cy="cartPage-headerComponents-container"
        >
          <img
            src="/icons/backIcon.svg"
            className="cursor-pointer z-50"
            data-cy="CartBackIcon"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.APPBAR_BACKICON_BUTTON,
              // });
              EnableScroll();
              close();
            }}
          />
          <span
            className="text-[13px] text-[#505050] regular flex-row items-center"
            data-cy="cartPage-textContainer-onHeader"
          >
            <svg
              data-cy="svg-textContainer"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <defs>
                <clipPath id="8876">
                  <rect
                    id="Rectangle_4612"
                    data-name="Rectangle 4612"
                    width="20"
                    height="20"
                    transform="translate(385 60)"
                    fill="none"
                  />
                </clipPath>
                <linearGradient
                  id="linear-gradient"
                  x1="0.5"
                  y1="0.955"
                  x2="0.5"
                  gradientUnits="objectBoundingBox"
                >
                  <stop offset="0" stopColor="#f53c3c" />
                  <stop offset="1" stopColor="#ff9696" />
                </linearGradient>
              </defs>
              <g
                id="Mask_Group_388"
                data-name="Mask Group 388"
                transform="translate(-385 -60)"
                clipPath="url(#8876)"
              >
                <g
                  id="Group_10817"
                  data-name="Group 10817"
                  transform="translate(385 61.666)"
                >
                  <g
                    id="Group_4037"
                    data-name="Group 4037"
                    transform="translate(5.751 0)"
                  >
                    <g
                      id="Group_4033"
                      data-name="Group 4033"
                      transform="translate(0 0)"
                    >
                      <g id="Group_4032" data-name="Group 4032">
                        <path
                          id="Path_15859"
                          data-name="Path 15859"
                          d="M-1.9-1.536H8.059L9.941,8.847S9,10.291,8.458,10.291a104.971,104.971,0,0,1-11-.182c-.9-.111-1.214-1.261-1.214-1.261Z"
                          transform="translate(4.064 6.144)"
                          fill="#2c2a2a"
                        />
                        <g id="bag-5">
                          <g id="Group_2946" data-name="Group 2946">
                            <path
                              id="Path_15168"
                              data-name="Path 15168"
                              d="M52,38.957H62.249a2,2,0,0,0,2-2,.213.213,0,0,0,0-.038l-1.663-9.393a1.1,1.1,0,0,0-1.1-.935h-1.2V25.454a3.164,3.164,0,1,0-6.327,0v1.137h-1.2a1.1,1.1,0,0,0-1.1.936L50,36.919a.216.216,0,0,0,0,.038A2,2,0,0,0,52,38.957Zm2.4-13.5a2.727,2.727,0,1,1,5.454,0v1.137H54.4ZM52.1,27.6v0a.67.67,0,0,1,.667-.569h1.2v1.726a.218.218,0,1,0,.436,0V27.027h5.454v1.726a.218.218,0,1,0,.436,0V27.027h1.2a.67.67,0,0,1,.667.569v0l1.661,9.375a1.566,1.566,0,0,1-1.564,1.546H52a1.566,1.566,0,0,1-1.564-1.546Z"
                              transform="translate(-50 -22.29)"
                              fill="#3c3c3c"
                            />
                          </g>
                        </g>
                      </g>
                      <path
                        id="Path_15172"
                        data-name="Path 15172"
                        d="M0,0A6.538,6.538,0,0,0,3.62,1.491,7.842,7.842,0,0,0,7.5,0"
                        transform="translate(3.377 10.89)"
                        fill="none"
                        stroke="#fce66e"
                        strokeLinecap="round"
                        strokeWidth="0.5"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_10626"
                    data-name="Group 10626"
                    transform="translate(0 5.458)"
                  >
                    <g
                      id="Group_4033-2"
                      data-name="Group 4033"
                      transform="translate(0 0)"
                    >
                      <g id="Group_4032-2" data-name="Group 4032">
                        <path
                          id="Path_15859-2"
                          data-name="Path 15859"
                          d="M-2.508-1.536h6.7L5.456,5.448s-.633.971-1,.971a70.666,70.666,0,0,1-7.4-.122c-.606-.074-.817-.848-.817-.848Z"
                          transform="translate(3.965 4.635)"
                          fill="url(#linear-gradient)"
                        />
                        <g id="bag-5-2" data-name="bag-5">
                          <g id="Group_2946-2" data-name="Group 2946">
                            <path
                              id="Path_15168-2"
                              data-name="Path 15168"
                              d="M51.345,33.5h6.893a1.347,1.347,0,0,0,1.346-1.348.144.144,0,0,0,0-.026l-1.122-6.315a.742.742,0,0,0-.737-.629h-.806v-.764a2.128,2.128,0,0,0-4.256,0v.764h-.806a.742.742,0,0,0-.737.629L50,32.129a.145.145,0,0,0,0,.026A1.347,1.347,0,0,0,51.345,33.5Zm1.611-9.082a1.833,1.833,0,0,1,3.667,0v.764H52.956Zm-1.547,1.444v0a.451.451,0,0,1,.444-.383h.813v1.161a.147.147,0,1,0,.293,0V25.476h3.667v1.161a.147.147,0,1,0,.293,0V25.476h.806a.451.451,0,0,1,.444.383v0l1.117,6.306a1.056,1.056,0,0,1-1.049,1.041H51.345a1.056,1.056,0,0,1-1.052-1.039Z"
                              transform="translate(-49.999 -22.291)"
                              fill="#3c3c3c"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
            <span
              className={`regular ml-[8px] ${
                language === "ar" || language === "ku" ? "text-right" : ""
              }`}
              data-cy="textContainer-textOnHeader"
            >
              {translate("Shopping Bag", language)}{" "}
              {cart.length > 0 && (
                <span className="bold" data-cy="length-ofItems">
                  {cart.length} {translate("Items")}
                </span>
              )}
            </span>
          </span>

          <img src="/icons/shareIcon.svg" data-cy="shareIcon-onHeader" />
        </div>
      </div>

      <div className="flex-col overflow-auto max-h-screen">
        <div className="flex-col  w-full h-auto mt-10 pb-[20px]">
          {!cart_loading && cartShippingSuccess !== null ? (
            <CartErrorComponent
              errorMessage={cartShippingSuccess}
              onRetry={handleRetry}
            />
          ) : !cart_loading && cartShippingSuccess === null ? (
            <>
              {cart.length > 0 ? (
                <>
                  {cart?.map((product, key) => (
                    <div
                      className="relative px-[12px]"
                      key={key}
                      data-cy="one-product"
                    >
                      <CartItemLink product={product} key={key}>
                        <CartItem product={product} index={key} />
                      </CartItemLink>
                      <QuantutyInput
                        id={product.id}
                        updateData={async () => {
                          await updateDataForProduct(product.slug);
                        }}
                        product={product}
                        maxAllowed={product.max_allowed_qty}
                        isCollectedAfterOrdering={Boolean(
                          product.collected_after_ordering,
                        )}
                        isHurry={true || product.have_hurry_up_notify}
                        disabled={false}
                        max={product.available_quantity}
                        setValue={() => {}}
                        value={product.quantity}
                        deleteFunction={() => {
                          RemoveFromCartAction(product);
                          GAevent({
                            action: GA_EVENT_NAMES.REMOVE_FROM_CART,
                            params: {
                              items: [
                                {
                                  item_id: product.product_id,
                                  item_name: product.name,
                                  item_variant: product.variant,
                                  quantity: 1,
                                  price: product.offer_price,
                                },
                              ],
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <EmptyCart />
              )}
            </>
          ) : (
            <>
              {[1, 1].map((s, key) => (
                <div
                  className="flex-col bg-white pb-10 pt-2 pl-2 pr-2"
                  key={key}
                >
                  <div className="flex-row min-h-[50px] bg-[#f8f8f8] rounded-2xl justify-between items-center pl-5 pr-5">
                    <Skeleton width={90} height={15} />
                  </div>
                  <div className="flex-col w-full">
                    {[1, 1].map((s, key) => (
                      <div
                        className="flex-row w-full relative  min-h-[191px] h-[191px] bg-[#FEFEFE] mt-3 rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                        key={key}
                      >
                        <div className="flex-row w-[110px] min-h-[191px] relative">
                          <Skeleton
                            width={110}
                            height={"100%"}
                            borderRadius={15}
                          />
                        </div>
                        <div className="flex-col mt-4 ml-5">
                          <div className="h-[10px] overflow-hidden">
                            <Skeleton
                              width={"90"}
                              height={10}
                              style={{
                                top: "0px",
                                maxHeight: "100%",
                                display: "flex",
                              }}
                            />
                          </div>
                        </div>
                        <div className="absolute right-4 bottom-3">
                          <div className="product-info-price">
                            <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                              <svg
                                className="bottom-3"
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
                            </div>
                            <div className="product-new-price text-[18px] bold"></div>
                            <div className="product-currency text-[8px] text-[#C4C2C2] regular"></div>
                          </div>
                        </div>
                        <div className="absolute top-1 right-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <OldCartContainer />
      </div>

      {!cart_loading && cartShippingSuccess === null && (
        <OrderButton toOrders={() => toOrders()} close={() => close()} />
      )}

      <CheckoutButton local={`${params.lang}`} />
    </div>
  );
}

export default CartContainer;

export const QuantutyInput = ({
  value,
  setValue,
  max,
  deleteFunction,
  id,
  disabled,
  updateData,
  isHurry,
  product,
  maxAllowed,
  isCollectedAfterOrdering,
}) => {
  const { initCart, settings, currency, removeFromCart } = useAppStore();
  const luckPrice = (product as any)?.luck_price;
  const effectiveOfferPrice =
    product?.is_luck && typeof luckPrice === "number"
      ? luckPrice
      : product?.offer_price;
  const hasDiscount =
    typeof effectiveOfferPrice === "number" &&
    effectiveOfferPrice >= 0 &&
    product.price !== effectiveOfferPrice;
  const currentUnitPrice = hasDiscount ? effectiveOfferPrice : product.price;
  const savingPercent =
    product.price > 0 && hasDiscount
      ? Math.max(
          0,
          Math.floor(
            ((product.price - currentUnitPrice) / product.price) * 100,
          ),
        )
      : 0;
  const [inputValue, setInputValue] = useState(parseInt(value));
  useEffect(() => {
    if (parseInt(value) === inputValue) return;
    setInputValue(parseInt(value));
  }, [value]);

  const updateQuantity = async (quantity, bool) => {
    try {
      let a = await fetchData({
        url: "/cart/update",
        reqTitle: REQUESTS_DATA.UPDATE_CART_ITEM,
        method: "POST",
        server: "market",
        body: JSON.stringify({ key: id, quantity: quantity }),
      });
      if (a.data.status === 0 && !a.success) {
        throw new Error(a.data.message);
      } else {
        updateData();
      }
      updateData();
    } catch (error) {
      setLoading(false);
      if (bool) {
        setInputValue(inputValue);
      } else {
        setInputValue(inputValue);
      }
      LogError({
        error: error,
        scenario: "Update Qty For Cart Item widget",
        id: id,
        quantity,
      });
    }
  };

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  const decreaseQuantity = async (i) => {
    if (!loading) {
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.DECREASE_QUANTITY_BUTTON_FROM_CART,
      // });
      setInputValue(parseInt(i) - 1);
      setLoading(true);

      await updateQuantity(parseInt(i.toString()) - 1, false);
      await getCart({
        callback: ([data, res]) => {
          initCart(data ?? { cart: [] });
        },
      });
      setLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const increaseQuantity = async (i) => {
    if (!loading) {
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.INCREASE_QUANTITY_BUTTON_FROM_CART,
      // });
      setInputValue(parseInt(i.toString()) + 1);
      setLoading(true);
      GAevent({
        action: GA_EVENT_NAMES.ADD_TO_CART,
        params: {
          currency: currency?.code,
          value: product?.offer_price,
          items: [
            {
              item_id: product.product_id,
              item_name: product?.name,
              price: product?.offer_price,
              quantity: parseInt(i.toString()) + 1,
              brand: product?.brand?.name,
              category: product?.category_name,
              // count_likes: product?.count_of_likes,
              // review_count: product?.shared_count,
              item_variant: product.variant,
            },
          ],
          user_id_custom: auth.UserID(),
          interaction_type: "add_to_cart",
          screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
          screen_path: window.location.pathname,
        },
      });
      await updateQuantity(parseInt(i.toString()) + 1, true);
      await getCart({
        callback: ([data, res]) => {
          initCart(data ?? { cart: [] });
        },
      });
      setLoading(false);
    }
  };
  const shouldDisablePlus = () => {
    // if (isCollectedAfterOrdering) {
    //   return false;
    // }

    // if (inputValue >= product.available_quantity) {
    //   return true;
    // }
    // return false;
    return false;
  };
  const ConvertToOldCart = async () => {
    try {
      setLoading(true);
      await cartService.ConvertToOldCart({ cart_item: id });
      setLoading(false);
      removeFromCart(id);
      await getOldCart();
    } catch (error) {
      LogError({
        error: error,
        scenario: "convert cart item to old cart widget",
        id: id,
      });
      setLoading(false);
    }
  };

  return (
    <div
      data-cy="card-footer"
      className={`${
        isRtl ? "right-[137px] flex-row-reverse" : "left-[137px] flex-row"
      } absolute flex-wrap ${"top-[125px]"}  items-center justify-between max-w-[calc(100%-152px)] w-full`}
    >
      <div className="flex-col px-[10px]">
        <div
          className={`${
            loading && "opacity-40"
          } flex-row hide-btn relative max-w-[72px] w-[72px] h-[24px] mt-4 z-50`}
          data-cy="plus-delete-increase-container"
        >
          <svg
            data-cy="square-icon"
            className="absolute hide-btn"
            xmlns="http://www.w3.org/2000/svg"
            width="72"
            height="24"
            viewBox="0 0 72 24"
          >
            <g
              id="Group_12755"
              data-name="Group 12755"
              transform="translate(-140 -277)"
            >
              <g
                id="Rectangle_5745"
                data-name="Rectangle 5745"
                transform="translate(140 277)"
                fill="none"
                stroke="#d3d3d3"
                strokeWidth="0.5"
              >
                <rect width="72" height="24" rx="5" stroke="none" />
                <rect
                  x="0.25"
                  y="0.25"
                  width="71.5"
                  height="23.5"
                  rx="4.75"
                  fill="none"
                />
              </g>
            </g>
          </svg>
          {!shouldDisablePlus() && (
            <div
              className="absolute hide-btn h-[24px] flex items-center right-[6px]  cursor-pointer"
              data-cy="PlusIcon_CartPage"
              onClick={() => {
                if (disabled) return false;
                // if (inputValue === max) {
                //   toast.error(translate("stock is limited"));
                //   return false;
                // }
                // // @ts-ignore
                // else {
                increaseQuantity(inputValue);
              }}
            >
              <Image
                width={12}
                height={12}
                alt="cart-plus-icon"
                className={"hide-btn"}
                src={"/icons/CartPlusIcon.svg"}
              />
            </div>
          )}

          {inputValue > 1 ? (
            <>
              <div
                className="absolute h-[24px] flex items-center hide-btn left-[6px]  cursor-pointer"
                data-cy="MinusIcon_CartPage"
                onClick={() => {
                  if (disabled) return false;
                  if (inputValue > 1) {
                    // @ts-ignore

                    decreaseQuantity(inputValue);
                  }
                }}
              >
                <Image
                  data-cy="minus-icon-svg"
                  width={12}
                  height={12}
                  alt="cart-plus-icon"
                  className={"hide-btn"}
                  src={"/icons/CartMinusIcon.svg"}
                />
              </div>
              {!loading && (
                <div
                  className="absolute h-[24px] flex items-center hide-btn right-[-20px] -top-px scale-125  cursor-pointer"
                  data-cy="DeleteIcon_CartPage"
                  onClick={() => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.REMOVE_PRODUCT_FROM_CART,
                    // });
                    deleteFunction();
                  }}
                >
                  <Image
                    data-cy="delete-icon-svg"
                    width={12}
                    height={12}
                    alt="cart-delete-icon"
                    src={"/icons/CartDeleteIcon.svg"}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              className="absolute h-[24px] flex items-center hide-btn left-[6px]  cursor-pointer"
              data-cy="DeleteIcon_CartPage"
              onClick={() => {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.REMOVE_PRODUCT_FROM_CART,
                // });
                deleteFunction();
              }}
            >
              <Image
                data-cy="delete-icon-svg"
                width={12}
                height={12}
                alt="cart-delete-icon"
                src={"/icons/CartDeleteIcon.svg"}
              />
            </div>
          )}
          <input
            // @ts-ignore
            value={parseInt(inputValue)}
            data-cy="QuantityInCart"
            max={max}
            disabled
            onChange={(e) => {}}
            className="outline-hidden hide-btn text-[14px] medium text-[#1D1D1D] text-center max-w-[72px] border-none py-1  w-[72px] h-[24px]"
          />
          {loading && <Spinner />}
        </div>
        {!disabled && (
          <div
            className="flex rounded-md p-[5px] items-center whitespace-nowrap bg-[#54b8ff] shadow-xs text-[10px] light mt-[5px] text-[#fafafa] cursor-pointer"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.CONVERT_TO_OLD_CART_BUTTON,
              // });
              ConvertToOldCart();
            }}
          >
            <svg
              className="mr-[5px]"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 14C4.7 14 2 11.3 2 8C2 4.7 4.7 2 8 2C11.3 2 14 4.7 14 8C14 11.3 11.3 14 8 14Z"
                fill="#fafafa"
              />
              <path d="M8.5 4H7V9L11.2 11.2L12 10L8.5 8.2V4Z" fill="#fafafa" />
            </svg>
            {translateFunction("Reschedule")}
          </div>
        )}
      </div>

      <div className="flex-col">
        <div className={`pl-[30px]`} data-cy="oldNew-price-container">
          <div className="product-info-price" data-cy="oldNew-price-container2">
            {hasDiscount ? (
              <>
                <div className="flex-col" data-cy="Subdivisions">
                  <div
                    className="flex-row gap-[4px]"
                    style={{
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                    data-cy="newOld-price"
                  >
                    <div
                      className="product-old-price text-[18px] text-[#C4C2C2] regular"
                      data-cy="oldPrice-container"
                    >
                      {RoundPrice({
                        num: product.price * product.quantity,
                        rate: currency?.exchange_rate,
                        points: currency?.decimal_digits,
                        language: languageVariable,
                      })}
                      <svg
                        data-cy="oldPrice-svg"
                        className="bottom-3"
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
                    </div>
                    <div
                      className={`${
                        (product as any)?.is_luck && "text-[#FF6200]"
                      } product-new-price text-[18px] bold m-0`}
                      data-cy="new-price"
                    >
                      {RoundPrice({
                        num: currentUnitPrice * product.quantity,
                        rate: currency?.exchange_rate,
                        points: currency?.decimal_digits,
                        language: languageVariable,
                      })}
                    </div>
                    <div
                      className="product-currency text-[8px] light text-[#1D1D1D] m-0"
                      data-cy="currency-symbol"
                    >
                      {currency?.symbol}
                    </div>
                  </div>
                  <div className="flex-row" data-cy="below-subdivisions">
                    <Image
                      alt="saved-icon"
                      data-cy="saved-svg"
                      width={10}
                      height={10}
                      src={"/icons/SavedIcon.svg"}
                    />
                    <span
                      className="text-[8px] text-[#388CFF] flex-row-reverse flex mx-[4px]"
                      data-cy="saved-text"
                    >
                      {translate("Saved")}{" "}
                      <span className="bold" data-cy="rate">
                        {savingPercent}%
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="product-new-price text-[14px] light text-[#1D1D1D]">
                  {RoundPrice({
                    num: currentUnitPrice * product.quantity,
                    rate: currency?.exchange_rate,
                    points: currency?.decimal_digits,
                    language: languageVariable,
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export const CartItemLink = ({ normalHeight = "191px", product, children }) => {
  const params = useParams();
  const { enableCart, language } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  let lang = params.lang;
  const isRtl = language === "ar" || language === "ku";

  const pickVariation = (item) => {
    if (!item) return {};
    if (Array.isArray(item?.variations)) return item.variations[0] ?? {};
    return item?.variations ?? {};
  };

  const getURLOfProduct = ({ product }) => {
    let productUrl;
    const variation = pickVariation(product);
    const colorParam = variation?.color_options || variation?.color;
    const sizeParam = variation?.size_options || variation?.Size;
    const hasValidColor = colorParam && colorParam !== "undefined";
    const hasValidSize = sizeParam && sizeParam !== "undefined";

    if (hasValidColor && !hasValidSize)
      productUrl = `/${lang}/products/${product.slug}${`?color=${colorParam}`}`;
    else if (!hasValidColor && hasValidSize)
      productUrl = `/${lang}/products/${product.slug}${`?size=${sizeParam}`}`;
    else if (!hasValidColor && !hasValidSize)
      productUrl = `/${lang}/products/${product.slug}`;
    else if (hasValidColor && hasValidSize)
      productUrl = `/${lang}/products/${
        product.slug
      }${`?size=${sizeParam}&color=${colorParam}`}`;
    return productUrl;
  };
  const getProductCartUrl = (product) => {
    return {
      href: getURLOfProduct({ product }),
      data: {
        is_product: true,
        name: product.name,
        images: [product?.image],
        price: product?.price,

        offer_price: product?.offer_price,
        href: getURLOfProduct({ product }),
      },
    };
  };
  if (params.productId === product?.slug) {
    return (
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } mt-2 w-full relative  bg-[#FEFEFE] cursor-pointer rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]`}
        style={{
          height: normalHeight,
          minHeight:
            product.have_hurry_up_notify ||
            product?.have_hurry_up_notify_time_left
              ? "230px"
              : `${normalHeight}`,
        }}
        onClick={(e) => {
          const newParams = new URLSearchParams();
          const variation = pickVariation(product);
          const colorParam = variation?.color || variation?.color_options;
          const sizeParam = variation?.Size || variation?.size_options;
          if (colorParam && colorParam !== "undefined") {
            newParams.set("color", colorParam);
          }
          if (sizeParam) {
            newParams.set("size", sizeParam);
          }
          router.push(pathname + `?${newParams.toString()}`, {
            scroll: false,
            // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
            shallow: true,
          });
          EnableScroll();
          enableCart(false);
        }}
      >
        {children}
      </div>
    );
  } else {
    return (
      <div
        onClick={(e) => {
          EnableScroll();
          enableCart(false);
        }}
      >
        <NextLink
          sameHref={isSamePage(getProductCartUrl(product).href)}
          href={getProductCartUrl(product).href}
          data={getProductCartUrl(product).data}
          ariaLabel={`Cart Product ${product.slug} ${params.lang}`}
          className={` mt-2  w-full relative ${
            isRtl ? "flex-row-reverse" : "flex-row"
          } bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]`}
          style={{
            height: normalHeight,
            minHeight:
              product.have_hurry_up_notify ||
              product?.have_hurry_up_notify_time_left
                ? "230px"
                : `${normalHeight}`,
          }}
        >
          {children}
        </NextLink>
      </div>
    );
  }
};
