import React from "react";
import PriceLabel from "./PriceLabel";
import BuyButton from "./BuyButton";
import { dispatchRouteChangeEvent } from "Hooks/events";
import NextLink from "Hooks/NextLink";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { useDispatch, useSelector } from "react-redux";

function ProductListTest({ products }) {
  const dispatchStore = useDispatch();
  const addToCart = (s) => {
    dispatchStore({ type: "AddToCartOptionEnable", payload: s });
  };
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const currency = useSelector((state: any) => state.homepage.currency) || 1;
  const getPrice = (num) => {
    return RoundPrice({
      num: num,
      rate: currency?.exchange_rate || 1,
      points:
        (decimal_point_settings &&
          decimal_point_settings["starting-setting"]?.decimal_point_settings) ||
        0,
    });
  };
  return (
    <>
      {products.map((s) => (
        <NextLink
          // @ts-ignore
          onClick={(e, bool = false) => {
            /* @ts-ignore*/
            if (
              /* @ts-ignore*/
              e.target.closest(".top-slider-enable") ||
              /* @ts-ignore*/
              e.target.closest(".product-photos-slider") ||
              /* @ts-ignore*/
              e.target.closest(".buy-button")
            ) {
              dispatchRouteChangeEvent("completed");
              e.preventDefault();
              return false;
            } else {
              dispatchRouteChangeEvent("start", { to: "products" });
              document.documentElement.style.overflow = "hidden";
              document.documentElement.scrollTop = 0;
            }
          }}
          href={`/products/${s.slug}`}
          className="product-container  align-center flex-col relative"
          //  onMouseLeave={() => {
          //    if (productState?.isActiveTopSlide || productState?.isColorSelected) {
          //      dispatch({ type: "setActiveTopSlide", payload: false });
          //      dispatch({ type: "setColor", payload: false });
          //    }
          //  }}
        >
          <img
            alt={s.name}
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              borderRadius: "15px",
              zIndex: "1",
              objectFit: "cover",
              objectPosition: "center",
            }}
            width={200}
            height={290}
            className="h-full w-full"
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/h_342/f_avif/1708506792?_a=DdATC1RAAZAA0"
            }
          />
          <div className="offer-blured" />

          <div className="product-photos max-h-[290px] overflow-visible w-100 justify-start align-center flex-col">
            <div className={`product-container-slider relative}`}>
              <img
                src={getConfiguredImage({
                  src: "https://res.cloudinary.com/dtcmozf4d/image/upload/h_400/f_avif/q_auto/v1/product/2024-05-12-663fd7393d9ac.png",
                  width: 400,
                  height: 400,
                })}
                width={200}
                className="max-h-[290px] h-[290px]"
                loading="eager"
                height={290}
                alt={"s"}
              />
            </div>
          </div>

          <div className="product-body w-100 flex-col align-start justify-start max-h-[30px]">
            <p className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10">
              {s.brand?.image && (
                <img
                  src={s.brand?.image.replace("/upload", "/upload/h_50/q_auto")}
                  width={16}
                  height={7}
                  alt={s.name}
                  className="max-h-[20px] max-w-[40px]"
                />
              )}
              {s.name.substring(0, 50)}

              {s.category && (
                <span className="product-category-icon align-center">
                  <span
                    style={{ display: "inline" }}
                    className="justify-start quantity flex f-10 align-center med-text"
                  >
                    1
                  </span>
                  {s.category?.icon && (
                    <img
                      src={s.category?.icon.replace(
                        "/upload",
                        "/upload/h_50/f_webp/q_auto"
                      )}
                      width={10}
                      height={10}
                      style={{
                        display: "inline",
                        minWidth: "10px",
                        minHeight: "10px",
                      }}
                      alt={s.name}
                      className="max-h-[20px] max-w-[40px]"
                    />
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="product-footer w-100 flex-row absolute align-center max-h-[30px]">
            <PriceLabel
              offer_price={getPrice(s.offer_price)}
              price_formatted={getPrice(s.price)}
            />
            <BuyButton
              buy={() => {
                addToCart(s);
              }}
            />
          </div>
        </NextLink>
      ))}
    </>
  );
}

export default ProductListTest;
