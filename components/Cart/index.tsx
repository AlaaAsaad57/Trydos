import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAppLanguage,
  getCart,
  getConfiguredImage,
  getLang,
  RoundPrice,
  Sendevent,
  translate,
} from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import Cookies from "js-cookie";

import ShareIcon from "public/svg/listing/shareIcon.svg";
import CartLabel from "public/svg/cart/cartLabel.svg";
import ErrorIcon from "public/svg/cart/Error.svg";
import Skeleton from "react-loading-skeleton";

import "styles/productDetails.css";
import NextLink from "Hooks/NextLink";
import { useParams, useSearchParams } from "next/navigation";
import home from "services/home";

import { toast } from "react-toastify";
import axios from "node_modules/axios";
import OrderButton from "./OrderButton";
function CartContainer({ close }) {
  const language = useSelector((state: any) => state.homepage.language);
  const oldCart = useSelector((state: any) => state.cart.oldCart);

  const loading = useSelector((state: any) => state.cart.loading);
  const cart = useSelector((state: any) => state.cart?.cart);
  const total_cash = useSelector((state: any) => state.cart?.total_cash);

  const currency = useSelector((state: any) => state.homepage.currency) || 1;
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: "CART-LOADING" });
    getCart({
      callback: ([data, res]) => {
        dispatch({ type: "CART-INIT", payload: data ?? { cart: [] } });
      },
    });
  }, []);
  const params = useParams();

  const sarchParams = useSearchParams();

  const ProductDetails = useSelector((state: any) => state.details.product);
  const searchParams = useSearchParams();
  return (
    <div className="flex-col fixed top-0 left-0 min-h-[100vh] max-h-[100vh] h-auto overflow-scroll w-full bg-[#ffffff] min-w-[100vw] z-[9999999999] pt-1">
      <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
        <div className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center ">
          <BackIcon
            className="cursor-pointer z-50"
            onClick={() => {
              Sendevent({
                event: "button_clicked",
                value: "appbar_backicon_button",
              });
              document.documentElement.style.overflow = "auto";
              close();
            }}
          />
          <span className="text-[13px] text-[#505050] regular flex-row items-center ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <defs>
                <clipPath id="clip-path">
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
                  <stop offset="0" stop-color="#f53c3c" />
                  <stop offset="1" stop-color="#ff9696" />
                </linearGradient>
              </defs>
              <g
                id="Mask_Group_388"
                data-name="Mask Group 388"
                transform="translate(-385 -60)"
                clip-path="url(#clip-path)"
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
                        stroke-linecap="round"
                        stroke-width="0.5"
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
            <span className="regular ml-[8px]">
              {translate("Shopping Bag", language)}{" "}
              {cart.length > 0 && (
                <span className="bold">{cart.length} Items</span>
              )}
            </span>
          </span>

          <ShareIcon />
        </div>
      </div>
      <div className="flex-col  w-full h-auto mt-10">
        {!loading ? (
          <>
            {cart.length > 0 ? (
              <>
                {cart?.map((product, key) => (
                  <div className="relative">
                    {" "}
                    <NextLink
                      href={
                        params?.productId === product.slug &&
                        product?.variations[0]?.color ===
                          sarchParams.get("color")
                          ? "#"
                          : `/products/${product.slug}${
                              product?.variations &&
                              product?.variations[0]?.color
                                ? `?color=${product?.variations[0]?.color}`
                                : ""
                            }`
                      }
                      className="flex-row mt-2 w-full relative  min-h-[161px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                      key={key}
                      onClick={(e) => {
                        // @ts-ignore
                        if (e.target.closest(".hide-btn")) return false;
                        // @ts-ignore
                        if (e.target.closest(".hide-btn")) return false;
                        setTimeout(() => {
                          if (document.querySelector("#nprogress"))
                            // @ts-ignore
                            document.querySelector("#nprogress").style.opacity =
                              "1";
                        }, 1000);
                        if (params?.productId === product.slug) {
                          if (product.variations[0].color) {
                            dispatch({
                              type: "SET-ACTIVE-COLOR-DETAILS",
                              payload:
                                ProductDetails.sync_color_images[
                                  ProductDetails.sync_color_images.findIndex(
                                    (s) =>
                                      s.color_name ===
                                      product?.variations[0]?.color
                                  )
                                ],
                            });
                          }
                        }
                        close();
                      }}
                    >
                      <div className="flex-row w-[110px] min-h-[161px] max-h-[161px] relative">
                        <img
                          src={getConfiguredImage({
                            height: 150,
                            width: 150,
                            src: product.image,
                          })}
                          width={110}
                          height={"100%"}
                          className="rounded-2xl"
                        />
                      </div>
                      <div className="flex-col mt-4 ml-5">
                        <div className="h-[10px] overflow-hidden">
                          <img
                            src={getConfiguredImage({
                              height: 150,
                              width: 150,
                              src: product.brand?.image,
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
                        <div className="text-xs mt-1 text-[#505050] flex regular">
                          {product.name}
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                          <CartItemTypeIcon />
                          <span className="ml-1.5"></span>
                        </div>
                        <div className="flex-row flex-wrap">
                          {product.variations[0]?.color && (
                            <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                              <CartColorIcon />
                              <span className="ml-1.5">color,</span>
                              <span className="regular">
                                {product.variations[0].color}
                              </span>
                            </div>
                          )}
                          {product.variations[0]?.Size && (
                            <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                              <CartSizeIcon />
                              <span className="ml-1.5">Size,</span>
                              <span className="regular">
                                {product.variations[0].Size}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                          <PiecesIcon />
                          <span className="ml-1.5 text-[#8D8D8D] regular">
                            Composed Of:{" "}
                          </span>
                          <span className="regular">
                            {product.count_of_pieces} Piece
                          </span>
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                          <DeleiveryIcon />
                          <span className="ml-1.5 text-[#8D8D8D] regular">
                            Shipping:{" "}
                          </span>
                          <span className="regular">
                            3 Days{" "}
                            <span className="ml-1 underline">Details</span>
                          </span>
                        </div>

                        {product.quantity > product.available_quantity && (
                          <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                            <ErrorIcon />
                            <span className="ml-1.5">Availabilty,</span>
                            <span className="regular ml-1">Out Of Stock</span>
                          </div>
                        )}
                      </div>

                      <div className="absolute right-4 bottom-3">
                        <div className="product-info-price">
                          {product.offer_price ? (
                            <>
                              <div className="flex-col">
                                <div className="flex-row">
                                  <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                                    {RoundPrice({
                                      num: product.price,
                                      rate: currency?.exchange_rate,
                                      points:
                                        (decimal_point_settings &&
                                          decimal_point_settings[
                                            "starting-setting"
                                          ]?.decimal_point_settings) ||
                                        0,
                                    })}
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
                                  <div className="product-new-price text-[18px] bold">
                                    {RoundPrice({
                                      num: product.offer_price,
                                      rate: currency.exchange_rate,
                                      points:
                                        (decimal_point_settings &&
                                          decimal_point_settings[
                                            "starting-setting"
                                          ]?.decimal_point_settings) ||
                                        0,
                                    })}
                                  </div>
                                  <div className="product-currency text-[8px] light text-[#1D1D1D]">
                                    {currency?.symbol}
                                  </div>
                                </div>
                                <div className="flex-row">
                                  <SavedIcon />
                                  <span className="text-[8px] text-[#388CFF]">
                                    Saved{" "}
                                    <span className="bold">
                                      {parseInt(
                                        (
                                          ((product.price -
                                            product.offer_price) /
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
                                  num: product.price,
                                  rate: currency.exchange_rate,
                                  points:
                                    (decimal_point_settings &&
                                      decimal_point_settings["starting-setting"]
                                        ?.decimal_point_settings) ||
                                    0,
                                })}
                              </div>
                            </>
                          )}
                          <div className="product-currency text-[8px] text-[#C4C2C2] regular">
                            {currency?.symbol}
                          </div>
                        </div>
                      </div>
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
                    </NextLink>{" "}
                    <QuantutyInput
                      id={product.id}
                      max={product.available_quantity}
                      setValue={() => {}}
                      value={product.quantity}
                      deleteFunction={() => {
                        dispatch({
                          type: "REMOVE-FROM-CART",
                          payload: product.id,
                        });
                        home.AddToCart({
                          alreadyExist: product.id,
                          callback: () => {},
                          color: product.variations[0].color,
                          size: product.variations[0].Size,
                          id: product.product_id,
                          image: product.image,
                          quantity: -1,
                          slug: product.slug,
                          errCallback: () => {
                            toast.error(translate("failed!", GetAppLanguage()));
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div className="flex-row items-center justify-center light text-[#5d5d5d] text-[16px]">
                {translate("Cart is Empty", GetAppLanguage())}
              </div>
            )}
          </>
        ) : (
          <>
            {[1, 1].map((s, key) => (
              <div className="flex-col bg-white pb-10 pt-2 pl-2 pr-2" key={key}>
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
        <>
          <hr className="p-4" />
          <div className="flex-row mt-0 min-h-[30px] w-full items-center justify-center bg-[#F8F8F8] rounded-[10px]">
            <CartLabel />{" "}
            <span className="regular text-[#5D5C5D]">
              {translate("Previously Viewed", GetAppLanguage())}
            </span>
            <span
              className="cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "remove_old_products_button",
                });
                home.hideOldCart({});
                dispatch({ type: "STORE-OLD-CART", payload: [] });
              }}
            >
              {translate("Hide All", GetAppLanguage())}
            </span>
          </div>
          <div className="flex-col  w-full h-auto mt-10">
            {!loading ? (
              <>
                {oldCart?.oldCart.map((product, key) => (
                  <div className="relative">
                    <NextLink
                      href={
                        params?.productId === product.slug &&
                        product?.variations[0]?.color ===
                          sarchParams.get("color")
                          ? "#"
                          : `/products/${product.slug}${
                              product?.variations &&
                              product?.variations[0]?.color
                                ? `?color=${product?.variations[0]?.color}`
                                : ""
                            }`
                      }
                      className="flex-row mt-2 w-full relative  min-h-[161px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                      key={key}
                      onClick={(e) => {
                        // @ts-ignore
                        if (e.target.closest(".hide-btn")) return false;
                        // @ts-ignore
                        if (e.target.closest(".hide-btn")) return false;
                        setTimeout(() => {
                          if (document.querySelector("#nprogress"))
                            // @ts-ignore
                            document.querySelector("#nprogress").style.opacity =
                              "1";
                        }, 1000);
                        if (params?.productId === product.slug) {
                          if (product.variations[0].color) {
                            dispatch({
                              type: "SET-ACTIVE-COLOR-DETAILS",
                              payload:
                                ProductDetails.sync_color_images[
                                  ProductDetails.sync_color_images.findIndex(
                                    (s) =>
                                      s.color_name ===
                                      product?.variations[0]?.color
                                  )
                                ],
                            });
                          }
                        }
                        close();
                      }}
                    >
                      <div className="flex-row w-[110px] min-h-[161px] max-h-[161px] relative">
                        <img
                          src={getConfiguredImage({
                            height: 150,
                            width: 150,
                            src: product.image,
                          })}
                          width={110}
                          height={"100%"}
                          className="rounded-2xl"
                        />
                      </div>
                      <div className="flex-col mt-4 ml-5">
                        <div className="h-[10px] overflow-hidden">
                          <img
                            src={getConfiguredImage({
                              height: 150,
                              width: 150,
                              src: product.brand?.image,
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
                        <div className="text-xs mt-1 text-[#505050] flex regular">
                          {product.name}
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                          <span className="ml-1.5"></span>
                        </div>
                        <div className="flex-row flex-wrap">
                          {product.variations[0]?.color && (
                            <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                              <CartColorIcon />
                              <span className="ml-1.5">color,</span>
                              <span className="regular">
                                {product.variations[0].color}
                              </span>
                            </div>
                          )}
                          {product.variations[0]?.Size && (
                            <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                              <CartSizeIcon />
                              <span className="ml-1.5">Size,</span>
                              <span className="regular">
                                {product.variations[0].Size}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                          <PiecesIcon />
                          <span className="ml-1.5 text-[#8D8D8D] regular">
                            Composed Of:{" "}
                          </span>
                          <span className="regular">
                            {product.count_of_pieces} Piece
                          </span>
                        </div>
                        <div className="flex-row items-center text-[12px] light text-[#505050] mt-1 mr-3">
                          <DeleiveryIcon />
                          <span className="ml-1.5 text-[#8D8D8D] regular">
                            Shipping:{" "}
                          </span>
                          <span className="regular">
                            3 Days{" "}
                            <span className="ml-1 underline">Details</span>
                          </span>
                        </div>

                        {product.quantity > product.available_quantity && (
                          <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                            <ErrorIcon />
                            <span className="ml-1.5">Availabilty,</span>
                            <span className="regular ml-1">Out Of Stock</span>
                          </div>
                        )}
                      </div>
                      {
                        <div
                          className="absolute right-4 bottom-16 hide-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            Sendevent({
                              event: "button_clicked",
                              value: "remove_old_product_item_button",
                            });

                            dispatch({
                              type: "HIDE-OLD-CART",
                              payload: product.id,
                            });
                            home.hideOldCart({ id: product.id });
                            setTimeout(() => {
                              if (document.querySelector("#nprogress"))
                                // @ts-ignore
                                document.querySelector(
                                  "#nprogress" // @ts-ignore
                                ).style.opacity = "0";
                            }, 1000);
                          }}
                        >
                          <span className="hide-btn cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]">
                            {translate("Hide", GetAppLanguage())}
                          </span>
                        </div>
                      }
                      <div className="absolute right-4 bottom-3">
                        <div className="product-info-price">
                          {product.offer_price ? (
                            <>
                              <div className="flex-col">
                                <div className="flex-row">
                                  <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                                    {RoundPrice({
                                      num: product.price,
                                      rate: currency?.exchange_rate,
                                      points:
                                        (decimal_point_settings &&
                                          decimal_point_settings[
                                            "starting-setting"
                                          ]?.decimal_point_settings) ||
                                        0,
                                    })}
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
                                  <div className="product-new-price text-[18px] bold">
                                    {RoundPrice({
                                      num: product.offer_price,
                                      rate: currency.exchange_rate,
                                      points:
                                        (decimal_point_settings &&
                                          decimal_point_settings[
                                            "starting-setting"
                                          ]?.decimal_point_settings) ||
                                        0,
                                    })}
                                  </div>
                                  <div className="product-currency text-[8px] light text-[#1D1D1D]">
                                    {currency?.symbol}
                                  </div>
                                </div>
                                <div className="flex-row">
                                  <SavedIcon />
                                  <span className="text-[8px] text-[#388CFF]">
                                    Saved{" "}
                                    <span className="bold">
                                      {parseInt(
                                        (
                                          ((product.price -
                                            product.offer_price) /
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
                              <div className="product-new-price text-[14px] bold">
                                {RoundPrice({
                                  num: product.price,
                                  rate: currency.exchange_rate,
                                  points:
                                    (decimal_point_settings &&
                                      decimal_point_settings["starting-setting"]
                                        ?.decimal_point_settings) ||
                                    0,
                                })}
                              </div>
                              <div className="product-currency text-[8px] light text-[#1D1D1D]">
                                {currency?.symbol}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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
                    </NextLink>
                    {/* <QuantutyInput
                      id={product.id}
                      value={product.quantity}
                      max={product.available_quantity}
                      setValue={() => {}}
                      deleteFunction={() => {
                        dispatch({
                          type: "HIDE-OLD-CART",
                          payload: product.id,
                        });
                        home.hideOldCart({ id: product.id });
                      }}
                    /> */}
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
          {!loading && <OrderButton close={() => close()} />}
        </>
      )}
    </div>
  );
}

export default CartContainer;

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
          <stop offset="0" stop-color="#f46eff" />
          <stop offset="0.34" stop-color="#61f8ec" />
          <stop offset="0.69" stop-color="#ffe943" />
          <stop offset="1" stop-color="#ff6767" />
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
        <clipPath id="clip-path1">
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
        clip-path="url(#clip-path1)"
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
        <clipPath id="clip-path2">
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
        clip-path="url(#clip-path2)"
      >
        <path
          id="courier-services"
          d="M10.145,5.084a.4.4,0,0,1-.4.39h-1.6A1.085,1.085,0,0,1,7.655,5.3L6.525,4.207a.382.382,0,0,1,0-.551.413.413,0,0,1,.569,0L8.167,4.694H9.743a.4.4,0,0,1,.4.39ZM3.354,4.992a.413.413,0,0,0,.569-.006l1.06-1.05.386,0,.206-.781-.625.007a1.084,1.084,0,0,0-.487.178L3.347,4.441a.382.382,0,0,0,.007.551ZM8.095,7.273l-1.184-.93.289-1.1L6.326,4.4a.649.649,0,0,1,0-.937.7.7,0,0,1,.968,0l.3.291.032-.121a.535.535,0,0,0-.4-.65l-.7-.174a.555.555,0,0,0-.671.385l-.162.614L5.1,6.067,4.37,7.435,2.893,7.353a.281.281,0,0,0-.3.262l-.018.361a.28.28,0,0,0,.271.289l1.994.093c.081,0,.252-.025.288-.095L5.9,6.775l.131.075,1.249.941L7.358,9.51a.282.282,0,0,0,.3.264l.373-.015A.28.28,0,0,0,8.3,9.473L8.218,7.542a.455.455,0,0,0-.123-.269Zm1.991-4.845H9.633v.564a.139.139,0,0,1-.141.136H8.9a.138.138,0,0,1-.141-.136V2.428H8.308a.139.139,0,0,0-.141.136V4.285a.139.139,0,0,0,.141.136h1.778a.139.139,0,0,0,.141-.136V2.565A.139.139,0,0,0,10.085,2.428Zm-.734,0h-.31v.427h.31ZM7.981,1.592h.493a.136.136,0,1,0,0-.273H7.919a.98.98,0,0,0-.078-.157A1.015,1.015,0,0,0,7.216.709a1.046,1.046,0,0,0-.773.108.989.989,0,0,0-.467.6l0,.011a.961.961,0,0,0-.028.165H7.981ZM.645,5.779a.136.136,0,1,0,0,.273H3.157a.136.136,0,1,0,0-.273ZM1.983,7.267H.588a.136.136,0,1,0,0,.273H1.983a.136.136,0,1,0,0-.273ZM3.368,1.586h1.62a.136.136,0,1,0,0-.273H3.368a.136.136,0,1,0,0,.273ZM2.731,4.427a.139.139,0,0,0-.141-.136H.367a.136.136,0,1,0,0,.273H2.59a.139.139,0,0,0,.141-.136Zm-.96-1.352H3.6a.136.136,0,1,0,0-.273H1.771a.136.136,0,1,0,0,.273Zm4.974-.418a.882.882,0,0,0,1.07-.614.83.83,0,0,0,.027-.178H6.084a.858.858,0,0,0,.661.793Z"
          transform="translate(-0.226 -0.227)"
          fill="#8d8d8d"
          fill-rule="evenodd"
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
        <clipPath id="clip-path3">
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
        clip-path="url(#clip-path3)"
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
const QuantutyInput = ({ value, setValue, max, deleteFunction, id }) => {
  const [inputValue, setInputValue] = useState(parseInt(value));
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
  const updateQuantity = async (quantity) => {
    let dataBody = [];
    let dataObj = { key: id, quantity: quantity };
    for (var property in dataObj) {
      if (dataObj[property] || dataObj[property] === 0) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(dataObj[property]);
        dataBody.push(encodedKey + "=" + encodedValue);
      }
    }
    // @ts-ignore
    dataBody = dataBody.join("&");
    const res = await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
      dataBody,
      {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("MARKET-TOKEN") ||
            localStorage.getItem("DEVICE-TOKEN")
          }`,
          lang: getLang(null, Cookies.get("language")),
          country: Cookies.get("country"),
        },
      }
    );
  };
  return (
    <div className="absolute bottom-[20px] left-[125px]">
      <div className="flex-row hide-btn relative max-w-[72px] w-[72px] h-[24px] mt-4 z-50">
        <svg
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
              stroke-width="0.5"
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
        <div
          className="absolute hide-btn h-[24px] flex items-center right-[6px]  cursor-pointer"
          onClick={() => {
            if (inputValue === max) return false;
            // @ts-ignore
            else {
              setInputValue(parseInt(inputValue.toString()) + 1);
              updateQuantity(parseInt(inputValue.toString()) + 1);
            }
          }}
        >
          <PlusIcon className="" />
        </div>

        {inputValue > 1 ? (
          <div
            className="absolute h-[24px] flex items-center hide-btn left-[6px]  cursor-pointer"
            onClick={() => {
              if (inputValue > 1) {
                // @ts-ignore
                setInputValue(parseInt(inputValue) - 1);
                updateQuantity(parseInt(inputValue.toString()) - 1);
              }
            }}
          >
            <MinusIcon className="" />
          </div>
        ) : (
          <div
            className="absolute h-[24px] flex items-center hide-btn left-[6px]  cursor-pointer"
            onClick={() => {
              deleteFunction();
            }}
          >
            <DeleteIcon />
          </div>
        )}
        <input
          // @ts-ignore
          value={parseInt(inputValue)}
          max={max}
          disabled
          onChange={(e) => {}}
          className="outline-none hide-btn text-[14px] medium text-[#1D1D1D] text-center max-w-[72px] border-none py-1  w-[72px] h-[24px]"
        />
      </div>
    </div>
  );
};
