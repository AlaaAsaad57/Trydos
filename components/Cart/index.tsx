import { useEffect, useState } from "react";

import {
  getCart,
  getOldCart,
  getConfiguredImage,
  RoundPrice,
  translateFunction,
  GetCartOreview,
  areProductsEqual,
} from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import ShareIcon from "public/svg/listing/shareIcon.svg";
import ErrorIcon from "public/svg/cart/Error.svg";
import Skeleton from "react-loading-skeleton";
import "styles/productDetails.css";
import NextLink from "components/global/NextLink";
import { useParams, useSearchParams } from "next/navigation";
import home from "services/home";
import OrderButton from "./OrderButton";
import Spinner from "components/global/Spinner";
import Timer from "components/Login/Timer";
import { QuantityDetailsProductApi } from "models/API/market/ProductQuantityDetails";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import cartService from "services/cart";
import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { EnableScroll, GetImageUrl } from "utils/tinyUtils";
import { CartContainerPropsType } from "models/componentType/CartContainerPropsType";
import { QuantutyInputPropsType } from "models/componentType/QuantutyInputPropsType";
import { fetchData } from "utils/fetchData";
import { useRouter } from "next/navigation";
import FlashDealBanner from "components/products/FlashDealBanner";
import { REQUESTS_DATA } from "utils/Requests";
import auth from "services/auth";
import CartErrorComponent from "./CartErrorComponent";

function CartContainer({ close, toOrders }: CartContainerPropsType) {
  const {
    storeOldCart,
    hideOldCart,
    initCart,
    removeFromCart,
    setCartLoading,
    setOrderData,
    currency,
    getProductDetailsForCart,
    setActiveColorDetails,
    language,
    oldCart,
    cart_loading,
    product,
    cart,
    cartShippingSuccess,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  const getURLOfProduct = ({ product }) => {
    let productUrl;
    if (product.variations[0]?.color && !product.variations[0]?.Size)
      productUrl = `/${lang}/products/${
        product.slug
      }${`?color=${product?.variations[0]?.color}`}`;
    else if (!product.variations[0]?.color && product.variations[0]?.Size)
      productUrl = `/${lang}/products/${
        product.slug
      }${`?size=${product?.variations[0]?.Size}`}`;
    else if (!product.variations[0]?.color && !product.variations[0]?.Size)
      productUrl = `/${lang}/products/${product.slug}`;
    else if (product.variations[0]?.color && product.variations[0]?.Size)
      productUrl = `/${lang}/products/${
        product.slug
      }${`?size=${product?.variations[0]?.Size}&color=${product?.variations[0]?.color}`}`;
    return productUrl;
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
            price: RoundPrice({
              num: item.offer_price,
              rate: currency?.exchange_rate,
              returnNumber: true,
            }),
            quantity: item.quantity,
            item_variant: item.variant ?? "N/A",
          })),
          screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
          screen_path: window.location.pathname,
        },
      });
    }
    await getOldCart();
  };

  const handleRetry = async () => {
    setCartLoading(true);
    await getData();
  };
  const params = useParams();

  const sarchParams = useSearchParams();

  const ProductDetails = product;
  const updateDataForProduct = async (slug) => {
    if (params?.productId === slug) {
      try {
        let response: QuantityDetailsProductApi = await fetchData({
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
        console.error(err);
      }
    }
  };
  const router = useRouter();
  const RemoveFromCartAction = async (product) => {
    removeFromCart(product.id);
    await cartService.RemoveFromCart({
      cart_item: { ...product, item_id: product.id },
    });
    await GetCartOreview();
    await updateDataForProduct(product.slug);
  };
  const getProductCartUrl = (product) => {
    let data,
      href = null;
    if (params?.productId === product.slug) {
      if (product.variations[0]?.color === sarchParams.get("color")) {
        data = null;
        return { href: "#", data };
      } else {
        let newParams = new URLSearchParams();
        if (product.variations[0]?.color) {
          newParams.set("color", product.variations[0]?.color);
        }
        if (product.variations[0]?.Size) {
          newParams.set("size", product.variations[0]?.Size);
        }
        return {
          href: `/${lang}/products/${product.slug}?${newParams.toString()}`,
          data,
        };
      }
    }
    return {
      href: getURLOfProduct({ product }),
      data: {
        is_product: true,
        active_color: product.variations[0]?.color ?? null,
        ...product,
        href: getURLOfProduct({ product }),
      },
    };
  };
  // Retrieve shipping_duration_days from sessionStorage
  let shippingDurationDays = 0;
  if (sessionStorage.getItem("starttingSetting")) {
    const settingsStr = sessionStorage.getItem("starttingSetting");
    if (settingsStr) {
      try {
        const settingsObj = JSON.parse(settingsStr);
        shippingDurationDays =
          parseInt(settingsObj?.["starting-setting"]?.shipping_duration_days) ||
          0;
      } catch (e) {
        shippingDurationDays = 0;
      }
    }
  }
  // Filter oldCart to exclude products that are in the current cart (with the same variation)
  const filteredOldCart =
    oldCart?.oldCart?.filter(
      (oldProduct) =>
        !cart.some((cartProduct) => areProductsEqual(oldProduct, cartProduct))
    ) || [];
  return (
    <div
      className={`flex-col ${
        cart.length > 0 ? "pb-[283px]" : "100px"
      }   top-0 left-0 min-h-screen max-h-full h-auto overflow-hidden w-full bg-[#ffffff] min-w-[100vw] z-[9999999999] pt-1`}
      data-cy="cartPage-container"
    >
      <div
        className="flex-col pl-2 pr-2 bg-[#fff] p-1"
        data-cy="cartPage-header-container"
      >
        <div
          className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center "
          data-cy="cartPage-headerComponents-container"
        >
          <BackIcon
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
                <clipPath id="clipPath">
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
                clipPath="url(#clipPath)"
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

          <ShareIcon data-cy="shareIcon-onHeader" />
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
                      {" "}
                      <NextLink
                        exportparts={
                          params?.productId === product.slug
                            ? "no-navigate"
                            : ""
                        }
                        href={getProductCartUrl(product).href}
                        data={getProductCartUrl(product).data}
                        ariaLabel={`Cart Product ${product.slug} ${params.lang}`}
                        className={`flex-row mt-2 w-full relative  ${
                          product.have_hurry_up_notify || true
                            ? "min-h-[230px]"
                            : "min-h-[161px]"
                        } bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]`}
                        key={key}
                        onClick={(e) => {
                          EnableScroll();
                          close();
                        }}
                      >
                        <div
                          className="flex-row w-[110px] min-h-[161px] max-h-[161px] relative"
                          data-cy="container-image-onCard"
                        >
                          <img
                            data-cy="image-onCard"
                            src={getConfiguredImage({
                              height: 150,
                              width: 150,
                              src: GetImageUrl(product.image),
                            })}
                            width={110}
                            height={"100%"}
                            className="rounded-2xl"
                          />
                        </div>
                        <div
                          className="flex-col mt-4 ml-5"
                          data-cy="container-ofProduct-information"
                        >
                          <div
                            className="h-[10px] overflow-hidden"
                            data-cy="container-ofProduct-information-img"
                          >
                            <img
                              data-cy="img-ofProduct-information"
                              src={getConfiguredImage({
                                height: 150,
                                width: 150,
                                src: GetImageUrl(
                                  product.brand?.icon?.file_path
                                ),
                              })}
                              height={10}
                              style={{
                                top: "0px",
                                maxHeight: "100%",
                                display: "flex",
                              }}
                              className="object-contain h-4 max-w-[90px] w-auto"
                            />
                          </div>
                          <div
                            className="text-[12px] mt-1 text-[#505050] flex regular"
                            data-cy="productNameInCart"
                          >
                            {product.name.substring(0, 30)}
                          </div>

                          <div
                            className="flex-row flex-wrap"
                            data-cy="color-div"
                          >
                            {product.variations[0]?.color && (
                              <div
                                className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3"
                                data-cy="color-div2"
                              >
                                <CartColorIcon data-cy="color-icon" />
                                <span
                                  data-cy="color-text"
                                  className={`${
                                    language === "ar" && "dir-rtl"
                                  } ml-1.5`}
                                >
                                  {translateFunction("Color")}:{" "}
                                  <span
                                    className="regular"
                                    data-cy="color-name"
                                  >
                                    {product.variations[0].color}
                                  </span>
                                </span>
                              </div>
                            )}
                            {product.variations[0]?.Size && (
                              <div
                                className="flex-row items-center text-[12px] light text-[#505050] mt-1"
                                data-cy="size-container"
                              >
                                <CartSizeIcon data-cy="size-svg" />
                                <span
                                  className={`ml-1.5 ${
                                    language === "ar" && "dir-rtl"
                                  }`}
                                  data-cy="size-container-text"
                                >
                                  {translateFunction("Size")}:
                                  <span
                                    className="regular"
                                    data-cy="size-container-size"
                                  >
                                    {product.variations[0].Size}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3"
                            data-cy="countPieces-container"
                          >
                            <PiecesIcon data-cy="pieces-svg" />
                            <span
                              className={`ml-1.5 ${
                                language === "ar" && "dir-rtl"
                              } text-[#8D8D8D] regular `}
                              data-cy="countPieces-text"
                            >
                              {translate("Composed Of:")}{" "}
                              <span
                                className="regular"
                                data-cy="countPieces-number"
                              >
                                {product.count_of_pieces} {translate("Piece")}
                              </span>
                            </span>
                          </div>
                          {product.shipping_days && (
                            <div
                              className="flex-row whitespace-nowrap items-center text-[12px] light text-[#505050] mt-1 mr-3"
                              data-cy="sshipping-container"
                            >
                              <DeleiveryIcon data-cy="sshipping-svg" />
                              <span
                                className={`ml-1.5 flex whitespace-nowrap ${
                                  language === "ar" && "dir-rtl"
                                } text-[#8D8D8D] regular`}
                                data-cy="shipping-text"
                              >
                                {translate("Shipping")}:{" "}
                                <span
                                  className="regular whitespace-nowrap"
                                  data-cy="days-number"
                                >
                                  {product.shipping_days + shippingDurationDays}{" "}
                                  {translate("Days")}{" "}
                                  <span
                                    className="ml-1 underline"
                                    data-cy="days-text"
                                  >
                                    {translate("Details")}
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}

                          {(!product.check_availability ||
                            product.is_country_restricted === true ||
                            product.is_active === false) && (
                            <div className="flex-row items-center mt-1 text-[12px] light text-[#fd445d]">
                              <ErrorIcon />
                              <div
                                className={`${language === "ar" && "dir-rtl"}`}
                              >
                                <span className="ml-1.5">
                                  {translateFunction("Availabilty")}:
                                </span>
                                <span className="regular ml-1">
                                  {translateFunction("Out Of Stock")}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        {product?.is_redeem && (
                          <div className="flex absolute origin-center scale-75 top-[30px] right-[-6px] bg-gradient-to-r rounded-[6px] from-[#f64f64] to-[#d73a49] p-[6px] text[12px] text-white items-center justify-center gap-[4px]">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="white"
                              className="animate-pulse"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M20 7h-2.18A3 3 0 0015 2a3.002 3.002 0 00-2.83 2H11.83A3.002 3.002 0 009 2a3 3 0 00-2.82 5H4a1 1 0 00-1 1v3a1 1 0 001 1h1v9a1 1 0 001 1h12a1 1 0 001-1v-9h1a1 1 0 001-1V8a1 1 0 00-1-1zM15 4a1 1 0 110 2h-2a1 1 0 110-2h2zM9 4a1 1 0 110 2H7a1 1 0 110-2h2zM5 9v-1h14v1H5zm2 2h10v8H7v-8z" />
                            </svg>
                            <span>{translateFunction("Redeem")}</span>
                          </div>
                        )}
                        <div
                          className="absolute top-1 right-1"
                          data-cy="card-numbering-container"
                        >
                          <input
                            data-cy="card-numbering-value"
                            defaultValue={key + 1}
                            type="number"
                            min={1}
                            disabled
                            max={product.available_quantity}
                            className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                          />
                        </div>
                        {(product.have_hurry_up_notify_time_left ||
                          product?.have_hurry_up_notify_qty) && (
                          <div className="absolute left-2  text-[#A28E5B] text-[12px] bottom-[8px] pl-3 w-[95%] h-[32px] bg-[#FDFDEF] rounded-[5px] flex items-center">
                            <span className="ml-1">
                              <HurryIcon />
                            </span>
                            <span className="bold ml-1">
                              {translate(
                                "Hurry Up!",
                                LocalizationServiceClass.GetAppLanguage()
                              )}
                            </span>
                            {product?.have_hurry_up_notify_time_left && (
                              <>
                                <span className="regular ml-1">
                                  {product.have_hurry_up_notify_time_left &&
                                    translate(
                                      "Time Running Out. ",
                                      LocalizationServiceClass.GetAppLanguage()
                                    )}
                                </span>

                                <span className="bold">
                                  -
                                  <Timer
                                    minutes={product.time_left_in_minutes}
                                    onFinish={() => {}}
                                  />
                                </span>
                              </>
                            )}
                            {product?.have_hurry_up_notify_qty && (
                              <>
                                <span className="regular ml-1">
                                  {product.have_hurry_up_notify_qty &&
                                    translate(
                                      "Quantity Running Out. ",
                                      LocalizationServiceClass.GetAppLanguage()
                                    )}
                                </span>

                                <span className="bold">
                                  -{product?.qty_left}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </NextLink>
                      <QuantutyInput
                        id={product.id}
                        updateData={async () => {
                          await updateDataForProduct(product.slug);
                        }}
                        product={product}
                        maxAllowed={product.max_allowed_qty}
                        isCollectedAfterOrdering={Boolean(
                          product.collected_after_ordering
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
                                  price: RoundPrice({
                                    num: product.offer_price,
                                    rate: currency?.exchange_rate,
                                    returnNumber: true,
                                  }),
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
                <div
                  className="flex-row items-center justify-center light text-[#5d5d5d] text-[16px]"
                  data-cy="EmptyCRart"
                >
                  {translate(
                    "Cart is Empty",
                    LocalizationServiceClass.GetAppLanguage()
                  )}
                </div>
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
                        className="flex-row w-full relative  min-h-[161px] bg-[#FEFEFE] mt-3 rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                        key={key}
                      >
                        <div className="flex-row w-[110px] min-h-[161px] relative">
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
        {oldCart?.oldCart?.length > 0 && (
          <div
            className="flex-col bg-[#F8F8F8]  w-full h-auto mt-10"
            data-cy="oldCart-outOfBag"
          >
            <hr className="p-4" data-cy="line" />
            <div
              className="flex-row mt-0 min-h-[30px] w-full items-center justify-start bg-[#F8F8F8] rounded-[10px]"
              data-cy="oldCart-viewer"
            >
              <span className="ml-[32px]" data-cy="spanContainer-oldCartIcon">
                <OldCartIcon data-cy="oldCart-icon" />
              </span>{" "}
              <span
                className="regular text-[#505050] text-[15px] ml-1"
                data-cy="outOfBag-text"
              >
                {translate(
                  "Out Of Bag!",
                  LocalizationServiceClass.GetAppLanguage()
                )}
              </span>
              <span
                data-cy="hideAll"
                className="cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]"
                onClick={() => {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.REMOVE_OLD_PRODUCTS_BUTTON,
                  // });
                  home.hideOldCart({});
                  storeOldCart([]);
                }}
              >
                {translate(
                  "Hide All",
                  LocalizationServiceClass.GetAppLanguage()
                )}
              </span>
            </div>
            <div
              className="flex-col  w-full h-auto mt-3 pb-[200px]"
              data-cy="Product_Non_Available_In_Cart"
            >
              {!cart_loading && cartShippingSuccess === null ? (
                <>
                  {filteredOldCart.map((product, key) => (
                    <div
                      className="relative px-[12px]"
                      key={key}
                      data-cy="oldProduct-card"
                    >
                      <NextLink
                        exportparts={
                          params?.productId === product.slug
                            ? "no-navigate"
                            : ""
                        }
                        data={getProductCartUrl(product).data}
                        href={getProductCartUrl(product).href}
                        ariaLabel={`old Cart Product ${product.slug} ${params.lang}`}
                        className="flex-row mt-2 w-full relative  min-h-[230px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                        key={key}
                        style={{ border: "1px solid #ff5f617a" }}
                        onClick={(e) => {
                          // @ts-ignore
                          if (e.target.closest(".hide-btn")) {
                            setTimeout(() => {
                              const { setIsNavigating } =
                                useAppStore.getState();
                              setIsNavigating(null);
                            }, 1500);
                            return false;
                          }
                          EnableScroll();
                          close();
                        }}
                      >
                        <div className="flex-row w-[110px] min-h-[161px] max-h-[161px] relative">
                          <img
                            src={getConfiguredImage({
                              height: 150,
                              width: 150,
                              src: GetImageUrl(product.image),
                            })}
                            width={110}
                            height={"100%"}
                            className="rounded-2xl opacity-50"
                          />
                        </div>
                        <div className="flex-col mt-4 ml-5">
                          <div className="h-[10px] overflow-hidden">
                            <img
                              src={getConfiguredImage({
                                height: 150,
                                width: 150,
                                src: GetImageUrl(
                                  product?.brand?.icon?.file_path
                                ),
                              })}
                              height={10}
                              style={{
                                top: "0px",
                                maxHeight: "100%",
                                display: "flex",
                              }}
                              className="object-contain h-4 max-w-[90px] w-auto"
                            />
                          </div>
                          <div className="text-[12px] mt-1 text-[#505050] flex regular">
                            {product.name.substring(0, 30)}
                          </div>
                          <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                            <span className="ml-1.5"></span>
                          </div>
                          <div className="flex-row flex-wrap">
                            {product.variations[0]?.color && (
                              <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                                <CartColorIcon />
                                <span
                                  className={`ml-1.5 ${
                                    language === "ar" && "dir-rtl"
                                  }`}
                                >
                                  {translateFunction("Color")}:
                                  <span className="regular">
                                    {product.variations[0].color}
                                  </span>
                                </span>
                              </div>
                            )}
                            {product.variations[0]?.Size && (
                              <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1">
                                <CartSizeIcon />
                                <span
                                  className={`ml-1.5 ${
                                    language === "ar" && "dir-rtl"
                                  }`}
                                >
                                  {translateFunction("Size")}:
                                  <span className="regular">
                                    {product.variations[0].Size}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                            <PiecesIcon />
                            <span
                              className={`ml-1.5 text-[#8D8D8D] regular ${
                                language === "ar" && "dir-rtl"
                              }`}
                            >
                              {translate("Composed Of:")}{" "}
                              <span className="regular">
                                {product.count_of_pieces} {translate("Piece")}
                              </span>
                            </span>
                          </div>
                          {product.shipping_days && (
                            <div className="flex-row whitespace-nowrap items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                              <DeleiveryIcon />
                              <span
                                className={`ml-1.5 whitespace-nowrap text-[#8D8D8D] regular ${
                                  language === "ar" && "dir-rtl"
                                }`}
                              >
                                {translate("Shipping")}{" "}
                                <span className="regular whitespace-nowrap">
                                  {product.shipping_days + shippingDurationDays}{" "}
                                  {translate("Days")}{" "}
                                  <span className="ml-1 underline">
                                    {translate("Details")}
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}

                          {/* {parseInt(product.quantity) >
                            product.available_quantity && (
                            <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                              <ErrorIcon />
                              <div
                                className={`${language === "ar" && "dir-rtl"}`}
                              >
                                <span className="ml-1.5">
                                  {translateFunction("Availabilty")}:
                                </span>
                                <span className="regular ml-1">
                                  {translateFunction("Out Of Stock")}
                                </span>
                              </div>
                            </div>
                          )} */}
                        </div>
                        {
                          <div
                            className="absolute right-4 top-[35px] hide-btn cursor-pointer z-40"
                            onClick={(e) => {
                              e.preventDefault();
                              // Sendevent({
                              //   event: GA_EVENT_NAMES.CLICK,
                              //   value:
                              //     GA_CLICK_EVENT_VALUES.REMOVE_OLD_PRODUCT_ITEM_BUTTON,
                              // });
                              hideOldCart(product.id);
                              home.hideOldCart({ id: product.id });
                            }}
                          >
                            <span className="hide-btn cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]">
                              {translate(
                                "Hide",
                                LocalizationServiceClass.GetAppLanguage()
                              )}
                            </span>
                          </div>
                        }

                        <div className="absolute top-1 right-1">
                          <input
                            defaultValue={key + 1}
                            type="number"
                            min={1}
                            disabled
                            max={product.available_quantity}
                            className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                          />
                        </div>
                        <div className="absolute flex-row cursor-pointer items-center pl-3 pr-3 max-w-[90vw] bottom-[8px] left-[9px] mx-auto right-[0px] w-full h-[32px] rounded-[15px] bg-[#F8F8F8]">
                          <span
                            style={{
                              height: "15px",
                              scale: "0.8",
                              transform: "translateY(-3px)",
                            }}
                          >
                            <OldCartIcon />
                          </span>
                          <span className="text-[#8D8D8D] bold text-[12px] ml-1">
                            {translate(
                              "Out Of Bag!",
                              LocalizationServiceClass.GetAppLanguage()
                            )}{" "}
                            <span className="regular">
                              {translate("Time Running Out.")}{" "}
                              <span className="bold">-30:00</span> |{" "}
                              {translate("Add Again?")}
                            </span>
                          </span>
                          <span className="ml-auto">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                            >
                              <g
                                id="Group_11624"
                                data-name="Group 11624"
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
                          </span>
                        </div>
                      </NextLink>
                      <QuantutyInput
                        id={product.id}
                        product={product}
                        updateData={async () => {}}
                        isCollectedAfterOrdering={false}
                        maxAllowed={product.max_allowed_qty}
                        disabled={true}
                        isHurry={false}
                        value={product.quantity}
                        max={product.available_quantity}
                        setValue={() => {}}
                        deleteFunction={() => {}}
                      />
                    </div>
                  ))}
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
                            className="flex-row w-full relative  min-h-[161px] bg-[#FEFEFE] mt-3 rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                            key={key}
                          >
                            <div className="flex-row w-[110px] min-h-[161px] relative">
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
          </div>
        )}
      </div>

      {!cart_loading && cartShippingSuccess === null && (
        <OrderButton toOrders={() => toOrders()} close={() => close()} />
      )}
    </div>
  );
}

export default CartContainer;
const HurryIcon = () => {
  return (
    <svg
      id="_15x15_photo_back"
      data-name="15x15 photo back"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <defs>
        <clipPath id="clipPath554">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_528"
        data-name="Mask Group 528"
        clipPath="url(#clipPath554)"
      >
        <g id="Layer1" transform="translate(0 0.768)">
          <path
            id="Path_22202"
            data-name="Path 22202"
            d="M10.869,2.435,10.65,3.448a.259.259,0,1,0,.507.109l.218-1.013a.259.259,0,0,0-.507-.109Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbef57"
            fillRule="evenodd"
          />
          <path
            id="Path_22203"
            data-name="Path 22203"
            d="M13.913,3.846l-.7.768a.259.259,0,1,0,.384.348l.7-.768a.259.259,0,1,0-.384-.348Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbef57"
            fillRule="evenodd"
          />
          <g
            id="Group_12717"
            data-name="Group 12717"
            transform="translate(0 2.039)"
          >
            <path
              id="Path_22204"
              data-name="Path 22204"
              d="M9.716,14.027H.907a.259.259,0,0,0,0,.518H9.716a.259.259,0,0,0,0-.518Z"
              transform="translate(-0.648 -3.12)"
              fill="#fbc02a"
              fillRule="evenodd"
            />
            <path
              id="Path_22205"
              data-name="Path 22205"
              d="M5.83,12.472H1.943a.259.259,0,1,0,0,.518H5.83a.259.259,0,0,0,0-.518Z"
              transform="translate(-0.648 -3.12)"
              fill="#fbc02a"
              fillRule="evenodd"
            />
            <path
              id="Path_22206"
              data-name="Path 22206"
              d="M4.793,10.917H2.721a.259.259,0,0,0,0,.518H4.793a.259.259,0,0,0,0-.518Z"
              transform="translate(-0.648 -3.12)"
              fill="#fbc02a"
              fillRule="evenodd"
            />
            <path
              id="Path_22207"
              data-name="Path 22207"
              d="M15.329,10.023a5.7,5.7,0,1,0-6.774,4.371,5.7,5.7,0,0,0,6.774-4.371Z"
              transform="translate(-0.648 -3.12)"
              fill="#fbc02a"
              fillRule="evenodd"
            />
          </g>
          <path
            id="Path_22208"
            data-name="Path 22208"
            d="M13.81,9.7a4.146,4.146,0,1,0-4.926,3.179A4.148,4.148,0,0,0,13.81,9.7Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbef57"
            fillRule="evenodd"
          />
          <path
            id="Path_22209"
            data-name="Path 22209"
            d="M11.583,6.932a.259.259,0,0,0-.183-.442h-2a.259.259,0,0,0-.237.153l-.982,2.2a.259.259,0,0,0,.237.365h.6L8.374,10.8a.259.259,0,0,0,.425.278l2.5-2.567a.259.259,0,0,0-.184-.44l-.667,0,1.134-1.133Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbc02a"
            fillRule="evenodd"
          />
          <path
            id="Path_22210"
            data-name="Path 22210"
            d="M11.653,2.869a.7.7,0,0,0,.828-.534l.034-.157a.7.7,0,0,0-.534-.828L10.81,1.1a.7.7,0,0,0-.828.535l-.034.157a.7.7,0,0,0,.535.828Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbc02a"
            fillRule="evenodd"
          />
          <path
            id="Path_22211"
            data-name="Path 22211"
            d="M14.375,4.614a.7.7,0,0,0,.985-.049l.108-.119a.7.7,0,0,0-.049-.985l-.887-.8a.7.7,0,0,0-.984.049l-.108.119a.7.7,0,0,0,.049.984Z"
            transform="translate(-0.648 -1.081)"
            fill="#fbc02a"
            fillRule="evenodd"
          />
        </g>
      </g>
    </svg>
  );
};
const OldCartIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="19"
      height="19"
      viewBox="0 0 19 19"
    >
      <defs>
        <clipPath id="clipPath22">
          <rect
            id="Rectangle_5771"
            data-name="Rectangle 5771"
            width="19"
            height="19"
            transform="translate(385 60)"
            fill="none"
          />
        </clipPath>
        <linearGradient
          id="linear-gradient22"
          x1="0.5"
          y1="0.955"
          x2="0.5"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#d3d3d3" />
          <stop offset="1" stopColor="#c4c2c2" />
        </linearGradient>
      </defs>
      <g
        id="Mask_Group_538"
        data-name="Mask Group 538"
        transform="translate(-385 -60)"
        clipPath="url(#clipPath22)"
      >
        <g
          id="Group_10817"
          data-name="Group 10817"
          transform="translate(385 61.583)"
        >
          <g
            id="Group_4037"
            data-name="Group 4037"
            transform="translate(5.463 0)"
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
                  d="M-1.992-1.536h9.46L9.256,8.328S8.361,9.7,7.847,9.7A99.722,99.722,0,0,1-2.607,9.527c-.856-.106-1.154-1.2-1.154-1.2Z"
                  transform="translate(4.048 5.913)"
                  fill="#8d8d8d"
                />
                <g id="bag-5">
                  <g id="Group_2946" data-name="Group 2946">
                    <path
                      id="Path_15168"
                      data-name="Path 15168"
                      d="M51.9,38.124h9.736a1.9,1.9,0,0,0,1.9-1.9.2.2,0,0,0,0-.036l-1.58-8.924a1.049,1.049,0,0,0-1.041-.888H59.774V25.3a3.005,3.005,0,1,0-6.011,0v1.08H52.625a1.049,1.049,0,0,0-1.041.889L50,36.188a.2.2,0,0,0,0,.036A1.9,1.9,0,0,0,51.9,38.124ZM54.177,25.3a2.591,2.591,0,0,1,5.182,0v1.08H54.177Zm-2.186,2.039v0a.637.637,0,0,1,.633-.54h1.138v1.64a.207.207,0,1,0,.414,0v-1.64h5.182v1.64a.207.207,0,1,0,.414,0v-1.64h1.138a.637.637,0,0,1,.633.54v0l1.578,8.906a1.488,1.488,0,0,1-1.486,1.468H51.9a1.488,1.488,0,0,1-1.486-1.468Z"
                      transform="translate(-50 -22.29)"
                      fill="#3c3c3c"
                    />
                  </g>
                </g>
              </g>
              <path
                id="Path_15172"
                data-name="Path 15172"
                d="M0,0A6.211,6.211,0,0,0,3.439,1.416,7.45,7.45,0,0,0,7.12,0"
                transform="translate(3.208 10.345)"
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
            transform="translate(0 5.185)"
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
                  d="M-2.571-1.536H3.793L5,5.1s-.6.923-.95.922A67.132,67.132,0,0,1-2.985,5.9c-.576-.071-.776-.806-.776-.806Z"
                  transform="translate(3.955 4.48)"
                  fill="url(#linear-gradient22)"
                />
                <g id="bag-5-2" data-name="bag-5">
                  <g id="Group_2946-2" data-name="Group 2946">
                    <path
                      id="Path_15168-2"
                      data-name="Path 15168"
                      d="M51.278,32.94h6.548a1.28,1.28,0,0,0,1.278-1.28.14.14,0,0,0,0-.024l-1.066-6a.705.705,0,0,0-.7-.6h-.766v-.726a2.021,2.021,0,0,0-4.043,0v.726h-.766a.705.705,0,0,0-.7.6l-1.065,6a.137.137,0,0,0,0,.024A1.28,1.28,0,0,0,51.278,32.94Zm1.531-8.628a1.742,1.742,0,0,1,3.483,0v.726H52.809Zm-1.47,1.372v0a.428.428,0,0,1,.422-.364h.772v1.1a.139.139,0,0,0,.279,0v-1.1H56.3v1.1a.139.139,0,0,0,.279,0v-1.1h.766a.428.428,0,0,1,.422.364v0l1.061,5.99a1,1,0,0,1-1,.989H51.278a1,1,0,0,1-1-.987Z"
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
  );
};
const CartItemTypeIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <g
        id="Mask_Group_329"
        data-name="Mask Group 329"
        transform="translate(0 0.36)"
      >
        <g id="dress" transform="translate(2 0.141)">
          <path
            id="Path_14636"
            data-name="Path 14636"
            d="M87.731,11.648l.628-.394a2.566,2.566,0,0,0,.993-1.162.184.184,0,0,1,.355.1l-.256,1.632a1.845,1.845,0,0,1-.848,1.283H86.862a1.845,1.845,0,0,1-.848-1.283l-.256-1.632a.184.184,0,1,1,.355-.1,2.566,2.566,0,0,0,.993,1.162l.628.394"
            transform="translate(-84.342 -9.959)"
            fill="#8d8d8d"
          />
          <path
            id="Path_14637"
            data-name="Path 14637"
            d="M14.242,177.67l2.519,5.751a.958.958,0,0,0-1.356,0,.959.959,0,0,1-1.356,0,.958.958,0,0,0-1.356,0,.959.959,0,0,1-1.356,0,.958.958,0,0,0-1.356,0L12.5,177.67Zm0,0"
            transform="translate(-9.979 -174.522)"
            fill="#8d8d8d"
          />
        </g>
      </g>
    </svg>
  );
};

const CartSizeIcon = () => {
  return (
    <svg
      id="Group_3130"
      data-name="Group 3130"
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <g id="Group_3129" data-name="Group 3129">
        <g id="Group_3128" data-name="Group 3128">
          <g id="Group_3127" data-name="Group 3127">
            <g id="Group_3126" data-name="Group 3126">
              <g id="Group_3125" data-name="Group 3125">
                <g id="Group_3124" data-name="Group 3124">
                  <g
                    id="Group_712"
                    data-name="Group 712"
                    transform="translate(2.401 4.919)"
                  >
                    <path
                      id="Path_14078"
                      data-name="Path 14078"
                      d="M34,42h3.629a.725.725,0,0,1,.726.726v3.387a.725.725,0,0,1-.726.726H34a.485.485,0,0,0,.484-.484V42.484A.487.487,0,0,0,34,42Z"
                      transform="translate(-32.548 -42)"
                      fill="#95ffe1"
                    />
                    <path
                      id="Path_14079"
                      data-name="Path 14079"
                      d="M28.968,42.484v.484H28A.967.967,0,0,1,28.968,42h.484A.485.485,0,0,0,28.968,42.484Z"
                      transform="translate(-28 -42)"
                      fill="#95ffe1"
                    />
                    <path
                      id="Path_14080"
                      data-name="Path 14080"
                      d="M28.968,58.484a.487.487,0,0,0,.484.484h-.484A.967.967,0,0,1,28,58h.968Z"
                      transform="translate(-28 -54.129)"
                      fill="#95ffe1"
                    />
                  </g>
                  <path
                    id="Path_14081"
                    data-name="Path 14081"
                    d="M32.968,58v.484a.485.485,0,0,1-.484.484A.487.487,0,0,1,32,58.484V58Z"
                    transform="translate(-27.172 -49.21)"
                    fill="#37bc9b"
                  />
                  <path
                    id="Path_14082"
                    data-name="Path 14082"
                    d="M32.968,42.484v.484H32v-.484A.485.485,0,0,1,32.484,42a.487.487,0,0,1,.484.484Z"
                    transform="translate(-27.172 -35.615)"
                    fill="#37bc9b"
                  />
                  <path
                    id="Path_14083"
                    data-name="Path 14083"
                    d="M24.419,46h.968v2.9H22V46h2.419Z"
                    transform="translate(-19.107 -40.113)"
                    fill="#ccd1d9"
                  />
                  <path
                    id="Path_14084"
                    data-name="Path 14084"
                    d="M5.871,36.9h.968v2.9H4.9A2.9,2.9,0,0,1,2,36.9V34a2.9,2.9,0,0,0,2.9,2.9Z"
                    transform="translate(-1.758 -31.016)"
                    fill="#ccd1d9"
                  />
                  <path
                    id="Path_14085"
                    data-name="Path 14085"
                    d="M20,12c0,1.34,2.064,2.361,4.839,2.417v0H20Z"
                    transform="translate(-17.665 -10.396)"
                    fill="#fcd770"
                  />
                  <path
                    id="Path_14086"
                    data-name="Path 14086"
                    d="M40.242,14.419c2.9,0,5.081-1.04,5.081-2.419v2.9c0,1.379-2.185,2.419-5.081,2.419H40V14.417C40.08,14.419,40.16,14.419,40.242,14.419Z"
                    transform="translate(-35.565 -10.714)"
                    fill="#e6e9ed"
                  />
                  <path
                    id="Path_14087"
                    data-name="Path 14087"
                    d="M10.226,22h.968v2.9H5.735a2.254,2.254,0,0,0-2.284,2.419L3.41,27.4A2.9,2.9,0,0,1,4.9,22h5.323Z"
                    transform="translate(-1.758 -19.564)"
                    fill="#e6e9ed"
                  />
                  <path
                    id="Path_14088"
                    data-name="Path 14088"
                    d="M24.081,2c2.326,0,4.081,1.04,4.081,2.419s-1.755,2.419-4.081,2.419c-.066,0-.13,0-.194,0C21.658,6.781,20,5.76,20,4.419,20,3.04,21.755,2,24.081,2Z"
                    transform="translate(-18.403 -1.758)"
                    fill="#95ffe1"
                  />
                  <ellipse
                    id="Ellipse_98"
                    data-name="Ellipse 98"
                    cx="2.065"
                    cy="0.413"
                    rx="2.065"
                    ry="0.413"
                    transform="translate(4.015 1.781)"
                    fill="#37bc9b"
                  />
                  <path
                    id="Path_14089"
                    data-name="Path 14089"
                    d="M34.935,7.419c1.085,0,1.935-.531,1.935-1.21S36.021,5,34.935,5,33,5.531,33,6.21,33.85,7.419,34.935,7.419Zm0-1.935c.855,0,1.452.382,1.452.726s-.6.726-1.452.726-1.452-.383-1.452-.726S34.08,5.484,34.935,5.484Z"
                    transform="translate(-28.737 -4.032)"
                    fill="#707070"
                  />
                  <path
                    id="Path_14090"
                    data-name="Path 14090"
                    d="M7.452,1C5.4,1,3.9,1.746,3.9,2.774V4.226H3.1A2.1,2.1,0,0,0,1,6.323V8.258a2.1,2.1,0,0,0,2.1,2.1H5.21A.808.808,0,0,0,6,11H8.742a.646.646,0,0,0,.645-.645V8.1a.646.646,0,0,0-.645-.645H6a.808.808,0,0,0-.79.645H3.1a1.761,1.761,0,0,1-.8-.2,1.343,1.343,0,0,1,1.36-1.418h3.8C9.508,6.484,11,5.738,11,4.71V2.774C11,1.746,9.508,1,7.452,1Zm0,.323c1.809,0,3.226.638,3.226,1.452S9.26,4.226,7.452,4.226,4.226,3.588,4.226,2.774,5.643,1.323,7.452,1.323ZM4.226,3.547a2.675,2.675,0,0,0,1.111.678H4.226Zm-2.9,4.711V7.435a2.1,2.1,0,0,0,1.613.976v.653h.323V8.419h.323v.645H3.9V8.419h.323V9.71h.323V8.419h.323v.645h.323V8.419h.323v.645h.323V8.419h.645v1.613H3.1A1.776,1.776,0,0,1,1.323,8.258Zm4.839-.323a.161.161,0,0,1,.323,0V8.1H6.161Zm0,2.581v-.161h.323v.161a.161.161,0,0,1-.323,0Zm-.615-.161h.293v.161a.475.475,0,0,0,.023.139A.483.483,0,0,1,5.546,10.355ZM9.065,8.1v2.258a.323.323,0,0,1-.323.323H6.777a.478.478,0,0,0,.03-.161V7.935a.478.478,0,0,0-.03-.161H8.742A.323.323,0,0,1,9.065,8.1Zm-3.2-.3a.475.475,0,0,0-.023.139V8.1H5.546A.483.483,0,0,1,5.861,7.8ZM10.677,4.71c0,.814-1.417,1.452-3.226,1.452h-3.8A1.629,1.629,0,0,0,1.981,7.7a1.772,1.772,0,0,1,.632-3.083v.576h.323V4.557c.053,0,.107-.008.161-.008h.161v1.29h.323V4.548H3.9v.645h.323V4.548h.323v.645h.323V4.548h.323v1.29h.323V4.548h.323v.645h.323V4.548h.323v.645h.323V4.548h.323v1.29h.323V4.548c.11,0,.216,0,.323-.007v.653H8.1V4.521c.11-.009.217-.02.323-.034v.706h.323V4.438a3.409,3.409,0,0,0,1.935-.891Z"
                    transform="translate(-1 -1)"
                    fill="#707070"
                  />
                  <path
                    id="Path_14091"
                    data-name="Path 14091"
                    d="M45,47h.484v2.419H45Z"
                    transform="translate(-38.021 -40.871)"
                    fill="#707070"
                  />
                  <path
                    id="Path_14092"
                    data-name="Path 14092"
                    d="M41,47h.484v2.419H41Z"
                    transform="translate(-34.656 -40.871)"
                    fill="#707070"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
const CartColorIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <defs>
        <linearGradient
          id="linear-gradient1"
          x1="0.5"
          x2="0.5"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#f46eff" />
          <stop offset="0.34" stopColor="#61f8ec" />
          <stop offset="0.69" stopColor="#ffe943" />
          <stop offset="1" stopColor="#ff6767" />
        </linearGradient>
      </defs>
      <g id="Exclusion_5" data-name="Exclusion 5" fill="url(#linear-gradient1)">
        <path
          d="M 5.000699996948242 9.850000381469727 C 2.32600998878479 9.850000381469727 0.1500000059604645 7.674330234527588 0.1500000059604645 5.000060081481934 C 0.1500000059604645 2.325730085372925 2.32600998878479 0.1500000059604645 5.000699996948242 0.1500000059604645 C 7.674610137939453 0.1500000059604645 9.850000381469727 2.325730085372925 9.850000381469727 5.000060081481934 C 9.850000381469727 7.674330234527588 7.674610137939453 9.850000381469727 5.000699996948242 9.850000381469727 Z M 5.000699996948242 1.915169954299927 C 3.300379991531372 1.915169954299927 1.917060017585754 3.299050092697144 1.917060017585754 5.000060081481934 C 1.917060017585754 6.700940132141113 3.300379991531372 8.084710121154785 5.000699996948242 8.084710121154785 C 6.699999809265137 8.084710121154785 8.082480430603027 6.700940132141113 8.082480430603027 5.000060081481934 C 8.082480430603027 3.299050092697144 6.699999809265137 1.915169954299927 5.000699996948242 1.915169954299927 Z"
          stroke="none"
        />
        <path
          d="M 5.000699996948242 9.699999809265137 C 7.591899871826172 9.699999809265137 9.699999809265137 7.591619968414307 9.699999809265137 5.000060081481934 C 9.699999809265137 2.408440113067627 7.591899871826172 0.300000011920929 5.000699996948242 0.300000011920929 C 2.408730030059814 0.300000011920929 0.300000011920929 2.408440113067627 0.300000011920929 5.000060081481934 C 0.300000011920929 7.591619968414307 2.408730030059814 9.699999809265137 5.000699996948242 9.699999809265137 M 5.000699996948242 1.765169978141785 C 6.782710075378418 1.765169978141785 8.232480049133301 3.216340065002441 8.232480049133301 5.000060081481934 C 8.232480049133301 6.783649921417236 6.782710075378418 8.234709739685059 5.000699996948242 8.234709739685059 C 3.217659950256348 8.234709739685059 1.767060041427612 6.783649921417236 1.767060041427612 5.000060081481934 C 1.767060041427612 3.216340065002441 3.217659950256348 1.765169978141785 5.000699996948242 1.765169978141785 M 5.000699996948242 10 C 2.243069887161255 10 0 7.757259845733643 0 5.000060081481934 C 0 2.242969989776611 2.243069887161255 0 5.000699996948242 0 C 7.756929874420166 0 10 2.242969989776611 10 5.000060081481934 C 10 7.757259845733643 7.756929874420166 10 5.000699996948242 10 Z M 5.000699996948242 2.065170049667358 C 3.382719993591309 2.065170049667358 2.067059993743896 3.381759881973267 2.067059993743896 5.000060081481934 C 2.067059993743896 6.618120193481445 3.382719993591309 7.934710025787354 5.000699996948242 7.934710025787354 C 6.617280006408691 7.934710025787354 7.932479858398438 6.618120193481445 7.932479858398438 5.000060081481934 C 7.932479858398438 3.381759881973267 6.617280006408691 2.065170049667358 5.000699996948242 2.065170049667358 Z"
          stroke="none"
          fill="#707070"
        />
      </g>
    </svg>
  );
};

const PiecesIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <defs>
        <clipPath id="clipPath1">
          <rect
            id="Rectangle_4751"
            data-name="Rectangle 4751"
            width="10"
            height="10"
            transform="translate(0 -0.36)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_329"
        data-name="Mask Group 329"
        transform="translate(0 0.36)"
        clipPath="url(#clipPath1)"
      >
        <g id="dress" transform="translate(1.424 -0.36)">
          <path
            id="Path_14636"
            data-name="Path 14636"
            d="M87.839,11.741l.662-.416A2.706,2.706,0,0,0,89.549,10.1a.195.195,0,0,1,.374.107l-.27,1.721a1.945,1.945,0,0,1-.894,1.353H86.923a1.945,1.945,0,0,1-.894-1.353l-.27-1.721a.195.195,0,1,1,.374-.107,2.706,2.706,0,0,0,1.048,1.225l.662.416"
            transform="translate(-84.265 -9.959)"
            fill="#8d8d8d"
          />
          <path
            id="Path_14637"
            data-name="Path 14637"
            d="M14.474,177.67l2.657,6.065a1.011,1.011,0,0,0-1.43,0,1.011,1.011,0,0,1-1.43,0,1.011,1.011,0,0,0-1.43,0,1.011,1.011,0,0,1-1.43,0,1.011,1.011,0,0,0-1.43,0l2.659-6.065Zm0,0"
            transform="translate(-9.979 -174.35)"
            fill="#8d8d8d"
          />
        </g>
      </g>
    </svg>
  );
};
export const DeleiveryIcon = () => {
  return (
    <svg
      id="_15x15_photo_back"
      data-name="15x15 photo back"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <defs>
        <clipPath id="clipPath2">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="10"
            height="10"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_497"
        data-name="Mask Group 497"
        clipPath="url(#clipPath2)"
      >
        <path
          id="courier-services"
          d="M10.145,5.084a.4.4,0,0,1-.4.39h-1.6A1.085,1.085,0,0,1,7.655,5.3L6.525,4.207a.382.382,0,0,1,0-.551.413.413,0,0,1,.569,0L8.167,4.694H9.743a.4.4,0,0,1,.4.39ZM3.354,4.992a.413.413,0,0,0,.569-.006l1.06-1.05.386,0,.206-.781-.625.007a1.084,1.084,0,0,0-.487.178L3.347,4.441a.382.382,0,0,0,.007.551ZM8.095,7.273l-1.184-.93.289-1.1L6.326,4.4a.649.649,0,0,1,0-.937.7.7,0,0,1,.968,0l.3.291.032-.121a.535.535,0,0,0-.4-.65l-.7-.174a.555.555,0,0,0-.671.385l-.162.614L5.1,6.067,4.37,7.435,2.893,7.353a.281.281,0,0,0-.3.262l-.018.361a.28.28,0,0,0,.271.289l1.994.093c.081,0,.252-.025.288-.095L5.9,6.775l.131.075,1.249.941L7.358,9.51a.282.282,0,0,0,.3.264l.373-.015A.28.28,0,0,0,8.3,9.473L8.218,7.542a.455.455,0,0,0-.123-.269Zm1.991-4.845H9.633v.564a.139.139,0,0,1-.141.136H8.9a.138.138,0,0,1-.141-.136V2.428H8.308a.139.139,0,0,0-.141.136V4.285a.139.139,0,0,0,.141.136h1.778a.139.139,0,0,0,.141-.136V2.565A.139.139,0,0,0,10.085,2.428Zm-.734,0h-.31v.427h.31ZM7.981,1.592h.493a.136.136,0,1,0,0-.273H7.919a.98.98,0,0,0-.078-.157A1.015,1.015,0,0,0,7.216.709a1.046,1.046,0,0,0-.773.108.989.989,0,0,0-.467.6l0,.011a.961.961,0,0,0-.028.165H7.981ZM.645,5.779a.136.136,0,1,0,0,.273H3.157a.136.136,0,1,0,0-.273ZM1.983,7.267H.588a.136.136,0,1,0,0,.273H1.983a.136.136,0,1,0,0-.273ZM3.368,1.586h1.62a.136.136,0,1,0,0-.273H3.368a.136.136,0,1,0,0,.273ZM2.731,4.427a.139.139,0,0,0-.141-.136H.367a.136.136,0,1,0,0,.273H2.59a.139.139,0,0,0,.141-.136Zm-.96-1.352H3.6a.136.136,0,1,0,0-.273H1.771a.136.136,0,1,0,0,.273Zm4.974-.418a.882.882,0,0,0,1.07-.614.83.83,0,0,0,.027-.178H6.084a.858.858,0,0,0,.661.793Z"
          transform="translate(-0.226 -0.227)"
          fill="#8d8d8d"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
};
const SavedIcon = () => {
  return (
    <svg
      id="_10x10_flag_photo"
      data-name="10x10 flag photo"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="10"
      height="10"
      viewBox="0 0 10 10"
    >
      <defs>
        <clipPath id="clipPath3">
          <rect
            id="Rectangle_4644"
            data-name="Rectangle 4644"
            width="10"
            height="10"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_530"
        data-name="Mask Group 530"
        clipPath="url(#clipPath3)"
      >
        <g id="Line_color" transform="translate(-0.118 -0.121)">
          <g id="Group_12726" data-name="Group 12726">
            <g id="Group_12723" data-name="Group 12723">
              <g id="Group_12722" data-name="Group 12722">
                <g id="Group_12721" data-name="Group 12721">
                  <path
                    id="Path_22213"
                    data-name="Path 22213"
                    d="M8.364,3.079c-2.089-1.292-4.238.754-4.238.754L1.85,6.109S.621,7.18,2.447,9s2.886.6,2.886.6L7.61,7.317s2.046-2.148.754-4.237ZM7.656,4.485a.494.494,0,1,1,0-.7A.493.493,0,0,1,7.656,4.485Z"
                    fill="#388cff"
                  />
                  <g id="Group_12720" data-name="Group 12720">
                    <path
                      id="Path_22214"
                      data-name="Path 22214"
                      d="M8.424,2.976a2.961,2.961,0,0,0-1.809-.432,4.053,4.053,0,0,0-1.532.478,4.862,4.862,0,0,0-1.165.849l-1.6,1.6c-.178.178-.355.358-.535.535a1.512,1.512,0,0,0-.22.269,1.56,1.56,0,0,0-.233.91A2.622,2.622,0,0,0,1.97,8.647c.633.792,1.727,1.746,2.833,1.4a1.478,1.478,0,0,0,.581-.336c.085-.081.166-.167.249-.25L7.285,7.812A6.7,6.7,0,0,0,8.092,6.9a3.843,3.843,0,0,0,.747-2.983,3.008,3.008,0,0,0-.372-.9c-.08-.132-.288-.011-.207.121a2.75,2.75,0,0,1,.395,1.74A3.827,3.827,0,0,1,8.178,6.3,4.593,4.593,0,0,1,7.4,7.361L5.837,8.92l-.556.556-.05.051c-.019.019-.04.038-.06.056l-.043.035c.024-.019-.028.02-.039.027a1.3,1.3,0,0,1-.772.232,2.311,2.311,0,0,1-1.364-.585c-.727-.586-1.673-1.616-1.309-2.64a1.336,1.336,0,0,1,.16-.306c.01-.014.04-.054.025-.034l.037-.045q.026-.03.054-.058l.263-.262L3.8,4.333a6.57,6.57,0,0,1,.835-.751,3.651,3.651,0,0,1,2.8-.754,2.793,2.793,0,0,1,.868.354c.132.081.253-.127.121-.207Z"
                      fill="#3c3c59"
                    />
                    <path
                      id="Path_22215"
                      data-name="Path 22215"
                      d="M7.572,4.4l-.026.024-.012.01c.017-.015,0,0,0,0a.557.557,0,0,1-.064.039l-.017.008c.014-.006,0,0-.008,0l-.014,0a.492.492,0,0,1-.07.018l-.014,0c.027,0,.009,0,0,0l-.034,0H7.283c-.008,0-.046-.005-.016,0A.547.547,0,0,1,7.206,4.5l-.032-.01L7.16,4.48c-.014,0,.018.009,0,0a.6.6,0,0,1-.06-.034l-.025-.017c.02.015-.01-.009-.015-.014a.573.573,0,0,1-.049-.052c.015.018,0-.006-.008-.012s-.014-.022-.021-.034l-.016-.031c-.01-.021,0,.014,0-.007a.558.558,0,0,1-.02-.07c0-.011,0-.022-.006-.033,0,.025,0,0,0-.011a.634.634,0,0,1,0-.072s0-.019,0,0,0,0,0-.008,0-.022.007-.033a.536.536,0,0,1,.021-.064c-.009.022,0,0,.006-.011l.017-.03.019-.029L7.015,3.9c-.01.014,0,0,0,0a.5.5,0,0,1,.047-.047l.016-.013s-.015.011,0,0l.033-.022L7.14,3.8l.018-.009s.017-.008,0,0l.022-.008.037-.011.028-.006.019,0s-.022,0-.008,0,.048,0,.072,0h.019s.019,0,0,0,0,0,0,0l.019,0a.491.491,0,0,1,.07.02l.014.005s-.018-.009-.006,0l.031.015.03.018.012.008s.024.018.012.008,0,0,0,0l.015.014.026.025.024.027s-.011-.015,0,0l.014.021a.616.616,0,0,1,.038.069c-.01-.021,0,0,0,.012s.008.025.011.037.006.025.008.038,0,.025,0,.008,0,0,0,.008a.491.491,0,0,1,0,.077s0,.025,0,.008,0,0,0,.008,0,.025-.008.038-.007.025-.011.037l-.007.018c-.006.016.009-.017,0,0a.723.723,0,0,1-.039.069l-.009.012c-.018.026.01-.009,0,0L7.572,4.4a.12.12,0,0,0,.17.17.623.623,0,0,0,.118-.7.614.614,0,0,0-.6-.344.613.613,0,1,0,.487,1.045.12.12,0,0,0-.17-.17Z"
                      fill="#3c3c59"
                    />
                  </g>
                </g>
              </g>
            </g>
            <g id="Group_12725" data-name="Group 12725">
              <g id="Group_12724" data-name="Group 12724">
                <path
                  id="Path_22216"
                  data-name="Path 22216"
                  d="M8.531,3.246A4.058,4.058,0,0,0,8.864,1.2c-.047-.4-.2-1-.673-1.075S7.368.553,7.178.909a4.078,4.078,0,0,0-.46,1.96c.008.458.105,1.252.661,1.375.15.033.215-.2.064-.231a.506.506,0,0,1-.323-.306,1.817,1.817,0,0,1-.155-.667,3.889,3.889,0,0,1,.3-1.767A2.348,2.348,0,0,1,7.646.641.743.743,0,0,1,8.062.362c.37-.052.5.479.549.744a3.7,3.7,0,0,1-.287,2.018c-.061.14.146.263.207.121Z"
                  fill="#3c3c59"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
const QuantutyInput = ({
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
}: QuantutyInputPropsType) => {
  const { initCart, settings, currency, removeFromCart } = useAppStore();
  const [inputValue, setInputValue] = useState(parseInt(value));
  useEffect(() => {
    if (parseInt(value) === inputValue) return;
    setInputValue(parseInt(value));
  }, [value]);
  const PlusIcon = ({ className }) => {
    return (
      <svg
        className={"hide-btn"}
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path
          id="Path_21462"
          className="hide-btn"
          data-name="Path 21462"
          d="M1.775.295A1.254,1.254,0,0,1,.85-.076,1.259,1.259,0,0,1,.48-1a1.183,1.183,0,0,1,.37-.9,1.3,1.3,0,0,1,.925-.347h9.41a1.275,1.275,0,0,1,.925.359,1.22,1.22,0,0,1,.37.915,1.22,1.22,0,0,1-.37.915,1.275,1.275,0,0,1-.925.359ZM6.445,4.812A1.478,1.478,0,0,1,5.37,4.4a1.424,1.424,0,0,1-.428-1.066V-5.705a1.4,1.4,0,0,1,.439-1.066,1.518,1.518,0,0,1,1.087-.417,1.43,1.43,0,0,1,1.075.417,1.467,1.467,0,0,1,.4,1.066V3.329A1.445,1.445,0,0,1,7.532,4.4,1.468,1.468,0,0,1,6.445,4.812Z"
          transform="translate(-0.48 7.188)"
          fill="#8d8d8d"
        />
      </svg>
    );
  };
  const MinusIcon = ({ className }) => {
    return (
      <svg
        className={"hide-btn"}
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="2.548"
        viewBox="0 0 12 2.548"
      >
        <path
          className="hide-btn"
          id="Path_22217"
          data-name="Path 22217"
          d="M1.775.295A1.254,1.254,0,0,1,.85-.076,1.259,1.259,0,0,1,.48-1a1.183,1.183,0,0,1,.37-.9,1.3,1.3,0,0,1,.925-.347h9.41a1.275,1.275,0,0,1,.925.359,1.22,1.22,0,0,1,.37.915,1.22,1.22,0,0,1-.37.915,1.275,1.275,0,0,1-.925.359Z"
          transform="translate(-0.48 2.254)"
          fill="#8d8d8d"
        />
      </svg>
    );
  };
  const DeleteIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="9.746"
        height="12"
        viewBox="0 0 9.746 12"
      >
        <path
          id="Path_14712"
          data-name="Path 14712"
          d="M.795,3.571V10.5a1.55,1.55,0,0,0,.412,1.069,1.384,1.384,0,0,0,1,.434H7.528a1.384,1.384,0,0,0,1-.434A1.55,1.55,0,0,0,8.945,10.5V3.571A1.074,1.074,0,0,0,8.669,1.46H7.231V1.109A1.1,1.1,0,0,0,6.118,0h-2.5a1.1,1.1,0,0,0-1.113,1.11V1.46H1.07A1.074,1.074,0,0,0,.795,3.571Zm6.734,7.865H2.211a.89.89,0,0,1-.854-.941V3.6H8.383v6.9A.89.89,0,0,1,7.528,11.437ZM3.071,1.109A.541.541,0,0,1,3.622.561h2.5a.541.541,0,0,1,.551.548V1.46h-3.6Zm-2,.913h7.6a.506.506,0,1,1,0,1.012H1.07a.506.506,0,1,1,0-1.012Zm0,0"
          transform="translate(0.003 0.001)"
          fill="#ff5f61"
        />
      </svg>
    );
  };

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
      console.error(error);
      setLoading(false);
      if (bool) {
        setInputValue(inputValue);
      } else {
        setInputValue(inputValue);
      }
    }
  };

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
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
          value: RoundPrice({
            num: product?.offer_price,
            rate: currency?.exchange_rate,
            returnNumber: true,
          }),
          items: [
            {
              item_id: product.product_id,
              item_name: product?.name,
              price: RoundPrice({
                num: product?.offer_price,
                rate: currency?.exchange_rate,
              }),
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
      setLoading(false);
    }
  };
  return (
    <div
      data-cy="card-footer"
      className={`absolute flex-wrap ${"top-[125px]"} left-[137px] flex-row items-center justify-between max-w-[calc(100%-152px)] w-full`}
    >
      <div className="flex-col">
        {" "}
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
              <PlusIcon className="" />
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
                <MinusIcon className="" data-cy="minus-icon-svg" />
              </div>
              {!loading && (
                <div
                  className="absolute h-[24px] flex items-center hide-btn right-[-20px] top-[-1px] scale-125  cursor-pointer"
                  data-cy="DeleteIcon_CartPage"
                  onClick={() => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.REMOVE_PRODUCT_FROM_CART,
                    // });
                    deleteFunction();
                  }}
                >
                  <DeleteIcon data-cy="delete-icon-svg" />
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
              <DeleteIcon data-cy="delete-icon-svg" />
            </div>
          )}
          <input
            // @ts-ignore
            value={parseInt(inputValue)}
            data-cy="QuantityInCart"
            max={max}
            disabled
            onChange={(e) => {}}
            className="outline-none hide-btn text-[14px] medium text-[#1D1D1D] text-center max-w-[72px] border-none py-1  w-[72px] h-[24px]"
          />
          {loading && <Spinner />}
        </div>
        {!disabled && (
          <div
            className="flex rounded-md p-[5px] items-center whitespace-nowrap bg-[#54b8ff] shadow-sm text-[10px] light mt-[5px] text-[#fafafa] cursor-pointer"
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
        {product.flash_deal_details?.end_date && (
          <div className="flex-row scale-[0.8] origin-top-right">
            <FlashDealBanner end_data={product.flash_deal_details?.end_date} />
          </div>
        )}
        <div className={`pl-[30px]`} data-cy="oldNew-price-container">
          <div className="product-info-price" data-cy="oldNew-price-container2">
            {product?.offer_price >= 0 &&
            product.price !== product.offer_price ? (
              <>
                <div className="flex-col" data-cy="Subdivisions">
                  <div className="flex-row" data-cy="newOld-price">
                    <div
                      className="product-old-price text-[18px] text-[#C4C2C2] regular"
                      data-cy="oldPrice-container"
                    >
                      {RoundPrice({
                        num: product.price * product.quantity,
                        rate: currency?.exchange_rate,
                        points:
                          (settings &&
                            settings["starting-setting"]
                              ?.decimal_point_settings) ||
                          0,
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
                      className="product-new-price text-[18px] bold"
                      data-cy="new-price"
                    >
                      {RoundPrice({
                        num: product?.offer_price * product.quantity,
                        rate: currency?.exchange_rate,
                        points:
                          (settings &&
                            settings["starting-setting"]
                              ?.decimal_point_settings) ||
                          0,
                      })}
                    </div>
                    <div
                      className="product-currency text-[8px] light text-[#1D1D1D]"
                      data-cy="currency-symbol"
                    >
                      {currency?.symbol}
                    </div>
                  </div>
                  <div className="flex-row" data-cy="below-subdivisions">
                    <SavedIcon data-cy="saved-svg" />
                    <span
                      className="text-[8px] text-[#388CFF]  need-row-rev mx-[4px]"
                      data-cy="saved-text"
                    >
                      {translate("Saved")}{" "}
                      <span className="bold" data-cy="rate">
                        {parseInt(
                          (
                            ((product.price - product?.offer_price) /
                              product.price) *
                            100
                          ).toString()
                        )}
                        %
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="product-new-price text-[14px] light text-[#1D1D1D]">
                  {RoundPrice({
                    num: product.price * product.quantity,
                    rate: currency?.exchange_rate,
                    points:
                      (settings &&
                        settings["starting-setting"]?.decimal_point_settings) ||
                      0,
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
const CartItemLink = (product_slug, children) => {
  const params = useParams();
  if (params.productId === product_slug) {
  } else {
  }
};
