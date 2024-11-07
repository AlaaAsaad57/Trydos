import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAppLanguage,
  getCart,
  getConfiguredImage,
  RoundPrice,
  translate,
} from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import CartIcon from "public/svg/CartIcon.svg";
import CartLabel from "public/svg/cart/cartLabel.svg";
import ErrorIcon from "public/svg/cart/Error.svg";
import Skeleton from "react-loading-skeleton";
import { LogData } from "store/homepage/actions";
import "styles/productDetails.css";
import NextLink from "Hooks/NextLink";
import { useParams, useSearchParams } from "next/navigation";
import home from "services/home";
function CartContainer({ close }) {
  const language = useSelector((state: any) => state.homepage.language);
  const oldCart = useSelector((state: any) => state.cart.oldCart);
  const oldBrands = useSelector((state: any) => state.cart.oldBrands);
  const loading = useSelector((state: any) => state.cart.loading);
  const cart = useSelector((state: any) => state.cart?.cart);
  const total_cash = useSelector((state: any) => state.cart?.total_cash);
  const brands = useSelector((state: any) => state.cart?.brands);
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
  const getProductsOfBrand = (s, CartVariable) => {
    return CartVariable?.filter((b) => b.boutique?.id === s?.id);
  };

  const getPriceOfBrand = (s, CartVariable) => {
    let prods = getProductsOfBrand(s, CartVariable);
    let pr = 0;
    prods?.map((product) => {
      pr += RoundPrice({
        num: (product.offer_price || product.price) * product.quantity,
        points:
          (decimal_point_settings &&
            decimal_point_settings["starting-setting"]
              ?.decimal_point_settings) ||
          0,
        rate: currency?.exchange_rate,
      });
    });
    return pr;
  };
  const sarchParams = useSearchParams();

  const ProductDetails = useSelector((state: any) => state.details.product);
  const searchParams = useSearchParams();
  return (
    <div className="flex-col fixed top-0 left-0 h-[100vh] w-full bg-[#F8F8F8] min-w-[100vw] z-[9999999999] pt-1">
      <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
        <div className="flex-row  w-full min-h-10 pl-1 pr-2  relative justify-between items-center ">
          <BackIcon
            className="cursor-pointer z-50"
            onClick={() => {
              document.documentElement.style.overflow = "auto";
              close();
            }}
          />
          <span className="text-[13px] text-[#505050] regular">
            {translate("Your Shopping Bag", language)}
          </span>
          <CartIcon />
          <CartBorderHeader />
        </div>
        <div className="flex-row mt-1 min-h-[30px] w-full items-center justify-center bg-[#F8F8F8] rounded-[10px]">
          <CartLabel />
          <div className="light ml-1 text-[13px] text-[#8D8D8D]">
            <span className="medium text-[#5D5C5D]">{cart?.length}</span>
            <span className="ml-[3px]">items</span>
            {cart?.length > 0 && (
              <>
                <span className="medium text-[#5D5C5D] ml-[3px]">
                  {RoundPrice({
                    num: total_cash,
                    points:
                      (decimal_point_settings &&
                        decimal_point_settings["starting-setting"]
                          ?.decimal_point_settings) ||
                      0,
                    rate: currency?.exchange_rate,
                  })}
                </span>
                <span className="ml-[3px]">{currency?.symbol}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-col overflow-auto w-full h-auto mt-10">
        {!loading ? (
          <>
            {cart.length > 0 ? (
              <>
                {brands?.map((boutique, key) => (
                  <>
                    {boutique?.id ? (
                      <BrandCart
                        close={close}
                        isOldCart={false}
                        key={key}
                        currency={currency}
                        price={getPriceOfBrand(boutique, cart)}
                        products={getProductsOfBrand(boutique, cart)}
                        boutique={boutique}
                      />
                    ) : (
                      <div
                        className="flex-col bg-[#FFF4B5] pb-10 rounded-2xl"
                        key={key}
                      >
                        <div className="flex-col w-full">
                          {getProductsOfBrand(boutique, cart).map(
                            (product, key) => (
                              <NextLink
                                href={
                                  params?.productId === product.slug &&
                                  product?.variations[0].color ===
                                    searchParams.get("color")
                                    ? "#"
                                    : `/products/${product.slug}${
                                        product?.variations &&
                                        product?.variations[0]?.color
                                          ? `?color=${product?.variations[0]?.color}`
                                          : ""
                                      }`
                                }
                                className="flex-row w-full relative  min-h-[161px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                                key={key}
                                onClick={(e) => {
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
                                <div className="flex-row w-[110px] min-h-[161px] relative">
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
                                  <div className="text-xs mt-1 text-[#505050] flex regular">
                                    {product.name}
                                  </div>
                                  <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                                    <CartItemTypeIcon />
                                    <span className="ml-1.5"></span>
                                  </div>
                                  {product.variations[0]?.color && (
                                    <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
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
                                  {product.quantity >
                                    product.available_quantity && (
                                    <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                                      <ErrorIcon />
                                      <span className="ml-1.5">
                                        Availabilty,
                                      </span>
                                      <span className="regular ml-1">
                                        Out Of Stock
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="absolute right-4 bottom-7">
                                  <div className="product-info-price">
                                    {product.offer_price ? (
                                      <>
                                        <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                                          {RoundPrice({
                                            num: product.price,
                                            rate: currency.exchange_rate,
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
                                      </>
                                    ) : (
                                      <>
                                        <div className="product-new-price text-[18px] bold">
                                          {RoundPrice({
                                            num: product.price,
                                            rate: currency.exchange_rate,
                                            points:
                                              (decimal_point_settings &&
                                                decimal_point_settings[
                                                  "starting-setting"
                                                ]?.decimal_point_settings) ||
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
                                    defaultValue={product.quantity}
                                    type="number"
                                    min={1}
                                    max={product.available_quantity}
                                    className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                                  />
                                </div>
                              </NextLink>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
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
                      <div className="absolute right-4 bottom-7">
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
            <div className="light ml-1 text-[13px] text-[#8D8D8D]">
              <span className="medium text-[#5D5C5D]">
                {oldCart.oldCart?.length}
              </span>
              <span className="ml-[3px]">items</span>
              <span className="medium text-[#5D5C5D] ml-[3px]">
                {RoundPrice({
                  num: oldCart.total_cash,
                  points:
                    (decimal_point_settings &&
                      decimal_point_settings["starting-setting"]
                        ?.decimal_point_settings) ||
                    0,
                  rate: currency?.exchange_rate,
                })}
              </span>
              <span className="ml-[3px]">{currency?.symbol}</span>
            </div>
            <span
              className="cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]"
              onClick={() => {
                home.hideOldCart({});
                dispatch({ type: "STORE-OLD-CART", payload: [] });
              }}
            >
              {translate("Hide All", GetAppLanguage())}
            </span>
          </div>
          <div className="flex-col overflow-auto w-full h-auto mt-10">
            {!loading ? (
              <>
                {oldBrands?.map((boutique, key) => (
                  <>
                    {boutique?.id ? (
                      <BrandCart
                        isOldCart={true}
                        close={close}
                        key={key}
                        currency={currency}
                        price={getPriceOfBrand(boutique, oldCart.oldCart)}
                        products={getProductsOfBrand(boutique, oldCart.oldCart)}
                        boutique={boutique}
                      />
                    ) : (
                      <div
                        className="flex-col bg-[#FFF4B5] pb-10 rounded-2xl"
                        key={key}
                      >
                        <div className="flex-col w-full">
                          {getProductsOfBrand(boutique, oldCart.oldCart).map(
                            (product, key) => (
                              <NextLink
                                href={
                                  params?.productId === product.slug &&
                                  product?.variations[0].color ===
                                    searchParams.get("color")
                                    ? "#"
                                    : `/products/${product.slug}${
                                        product?.variations &&
                                        product?.variations[0]?.color
                                          ? `?color=${product?.variations[0]?.color}`
                                          : ""
                                      }`
                                }
                                className="flex-row w-full relative  min-h-[161px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                                key={key}
                                onClick={(e) => {
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
                                <div className="flex-row w-[110px] min-h-[161px] relative">
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
                                  <div className="text-xs mt-1 text-[#505050] flex regular">
                                    {product.name}
                                  </div>
                                  <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                                    <CartItemTypeIcon />
                                    <span className="ml-1.5"></span>
                                  </div>
                                  {product.variations[0]?.color && (
                                    <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
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
                                  {product.quantity >
                                    product.available_quantity && (
                                    <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                                      <ErrorIcon />
                                      <span className="ml-1.5">
                                        Availabilty,
                                      </span>
                                      <span className="regular ml-1">
                                        Out Of Stock
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="absolute right-4 bottom-7">
                                  <div className="product-info-price">
                                    {product.offer_price ? (
                                      <>
                                        <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                                          {RoundPrice({
                                            num: product.price,
                                            rate: currency.exchange_rate,
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
                                      </>
                                    ) : (
                                      <>
                                        <div className="product-new-price text-[18px] bold">
                                          {RoundPrice({
                                            num: product.price,
                                            rate: currency.exchange_rate,
                                            points:
                                              (decimal_point_settings &&
                                                decimal_point_settings[
                                                  "starting-setting"
                                                ]?.decimal_point_settings) ||
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
                                    defaultValue={product.quantity}
                                    type="number"
                                    min={1}
                                    max={product.available_quantity}
                                    className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                                  />
                                </div>
                              </NextLink>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
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
                          <div className="absolute right-4 bottom-7">
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
        </>
      )}
    </div>
  );
}

export default CartContainer;
const CartBorderHeader = () => {
  useEffect(() => {
    document.documentElement.scrollTo({ top: 0 });
    document.documentElement.style.overflow = "hidden";
  }, []);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="40"
      className="absolute top-0 left-0"
    >
      <g
        id="Rectangle_5281"
        data-name="Rectangle 5281"
        fill="none"
        stroke="#707070"
        strokeWidth="0.5"
        stroke-dasharray="3 3"
      >
        <rect width="410" height="40" rx="8" stroke="none" />
        <rect
          x="0.25"
          y="0.25"
          width="100%"
          height="39.5"
          rx="7.75"
          fill="none"
        />
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
        clip-path="url(#clip-path)"
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
          id="linear-gradient"
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
      <g id="Exclusion_5" data-name="Exclusion 5" fill="url(#linear-gradient)">
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
export const BrandCart = ({
  key,
  boutique,
  products,
  price,
  currency,
  close,
  isOldCart,
}) => {
  const dispatch = useDispatch();
  const ProductDetails = useSelector((state: any) => state.details.product);
  const [expanded, setExpanded] = useState(true);
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const params = useParams();
  const sarchParams = useSearchParams();
  return (
    <div className="flex-col bg-white pb-10 pt-2 pl-2 pr-2" key={key}>
      <div
        className="flex-row min-h-[50px] bg-[#f8f8f8] rounded-2xl justify-between items-center pl-5 pr-5"
        onClick={() => setExpanded(!expanded)}
      >
        <img
          src={getConfiguredImage({
            src: boutique.icon,
            width: 90,
            height: 90,
          })}
          className="object-contain h-4 max-w-[90px] w-auto"
          height={15}
        />
        <div className="flex-row">
          <CartLabel />
          <div className="light ml-3 text-[13px] text-[#8D8D8D]">
            <span className="medium text-[#5D5C5D]">{products.length}</span>
            <span className="ml-[3px]">items</span>
            <span className="medium text-[#5D5C5D] ml-[3px]">{price}</span>
            <span className="ml-[3px]">{currency?.symbol}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="flex-col w-full">
          {products?.map((product, key) => (
            <NextLink
              href={
                params?.productId === product.slug &&
                product?.variations[0]?.color === sarchParams.get("color")
                  ? "#"
                  : `/products/${product.slug}${
                      product?.variations && product?.variations[0]?.color
                        ? `?color=${product?.variations[0]?.color}`
                        : ""
                    }`
              }
              className="flex-row w-full relative  min-h-[161px] bg-[#FEFEFE] rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
              key={key}
              onClick={(e) => {
                // @ts-ignore
                if (e.target.closest(".hide-btn")) return false;
                setTimeout(() => {
                  if (document.querySelector("#nprogress"))
                    // @ts-ignore
                    document.querySelector("#nprogress").style.opacity = "1";
                }, 1000);
                if (params?.productId === product.slug) {
                  if (product.variations[0].color) {
                    dispatch({
                      type: "SET-ACTIVE-COLOR-DETAILS",
                      payload:
                        ProductDetails.sync_color_images[
                          ProductDetails.sync_color_images.findIndex(
                            (s) =>
                              s.color_name === product?.variations[0]?.color
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
                {product.variations[0]?.color && (
                  <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
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
                {product.quantity > product.available_quantity && (
                  <div className="flex-row items-center text-[12px] light text-[#fd445d]">
                    <ErrorIcon />
                    <span className="ml-1.5">Availabilty,</span>
                    <span className="regular ml-1">Out Of Stock</span>
                  </div>
                )}
              </div>
              {isOldCart && (
                <div
                  className="absolute right-4 bottom-16 hide-btn"
                  onClick={(e) => {
                    e.preventDefault();

                    dispatch({ type: "HIDE-OLD-CART", payload: product.id });
                    home.hideOldCart({ id: product.id });
                    setTimeout(() => {
                      if (document.querySelector("#nprogress"))
                        // @ts-ignore
                        document.querySelector("#nprogress").style.opacity =
                          "0";
                    }, 1000);
                  }}
                >
                  <span className="hide-btn cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]">
                    {translate("Hide", GetAppLanguage())}
                  </span>
                </div>
              )}
              <div className="absolute right-4 bottom-7">
                <div className="product-info-price">
                  {product.offer_price ? (
                    <>
                      <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                        {RoundPrice({
                          num: product.price,
                          rate: currency?.exchange_rate,
                          points:
                            (decimal_point_settings &&
                              decimal_point_settings["starting-setting"]
                                ?.decimal_point_settings) ||
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
                              decimal_point_settings["starting-setting"]
                                ?.decimal_point_settings) ||
                            0,
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="product-new-price text-[18px] bold">
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
                  defaultValue={parseInt(product.quantity)}
                  type="number"
                  min={1}
                  max={product.available_quantity}
                  className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                />
              </div>
            </NextLink>
          ))}
        </div>
      )}
    </div>
  );
};
