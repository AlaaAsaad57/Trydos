"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import CartIcon from "public/svg/CartIcon.svg";

import { getConfiguredImage, Sendevent } from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SelectColor({ close }) {
  const cart = useSelector((state: StateInterface) => state.cart?.localCart);

  const AddToCartOption = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption
  );
  const SelectedProduct = useSelector(
    (state: StateInterface) => state.cart.SelectedProduct
  );

  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const enableCart = (s) => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");

      // Use router.push with pathname and updated query
      router.push(`${pathname}?${newParams.toString()}`);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      router.push(`${pathname}?${newParams.toString()}`);
    }
  };

  return (
    <>
      <div className="blur-md bg-[#f4f4f480] backdrop-blur-[10px] flex fixed top-0 left-0 h-full w-full z-[999999999]" />

      <div className="back-bar align-center w-100 flex-row min-h-12 bg-[#fff] p-4 z-[9999999999] fixed top-0 justify-between">
        <div
          className="back-icon p-0"
          onClick={() => {
            document.documentElement.style.overflow = "auto";
            document.documentElement.scrollTop = 0;
            close();
            dispatch({ type: "AddToCartOptionDisable", payload: false });
          }}
        >
          <BackIcon />
        </div>
        <span className="relative">
          {cart?.length > 0 && (
            <span className="bg-green-500 z-10 bottom-[-10px] left-[-10px] text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
              {cart.length}
            </span>
          )}
          <CartIcon
            id="cart-icon"
            className="cart-icon"
            onClick={() => {
              dispatch({ type: "AddToCartOptionDisable", payload: false });
              close();
              enableCart(true);
            }}
          />
        </span>
      </div>
      <div className="flex-col mt-[10px] w-full fixed  left-0 z-[9999999999] top-[50px] items-center">
        <div className="flex-row w-auto justify-center moved-min-img relative rounded-[15px] inset-select-shadow-image image-cart-container">
          <svg
            className="absolute  top-0 left-0"
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
            id={"added-to-cart"}
            src={getConfiguredImage({
              height: 400,
              width: 400,
              src:
                (AddToCartOption?.selectedColor?.images &&
                  AddToCartOption?.selectedColor?.images[0]) ||
                (SelectedProduct?.images && SelectedProduct?.images[0]),
            })}
            className={"h-full object-top rounded-[15px] moved-img "}
          />
        </div>
        {SelectedProduct?.sync_color_images && (
          <div className="flex  w-full max-w-[420px] ">
            <SelectColorsSlider colors={SelectedProduct.sync_color_images} />
          </div>
        )}
      </div>
    </>
  );
}

export default SelectColor;
export const SelectColorsSlider = ({ colors }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const setActive = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("color", e.color_name);
    router.push(pathname + `?${newParams.toString()}`, { scroll: false });
    dispatch({ type: "AddToCartColor", payload: e });
    Sendevent({ event: "button_clicked", value: "slide_choose_color_event" });
  };
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("color")) {
      let color = colors.filter(
        (s) => s.color_name === searchParams.get("color")
      )[0];
      if (color) dispatch({ type: "AddToCartColor", payload: color });
    }
  }, []);
  const getInitial = () => {
    if (searchParams.get("color")) {
      let index = 0;
      colors.map((s, i) => {
        if (s.color_name === searchParams.get("color")) index = i;
      });
      return index;
    }

    return 0;
  };
  return (
    <Swiper
      modules={[EffectCoverflow]}
      speed={100}
      style={{
        width: "100%",
        margin: "0",
      }}
      effect="coverflow"
      className="mt-[10px] "
      coverflowEffect={{
        rotate: 0,
        depth: 120,
        modifier: 1,
        scale: 1,
        stretch: 20,
        slideShadows: false,
      }}
      onSlideChange={(e) => {
        setActive(colors[e.activeIndex]);
      }}
      slidesPerView={7}
      initialSlide={getInitial()}
      threshold={1}
      centeredSlides={true}
      loop={false}
    >
      {colors?.map((color, i) => (
        <SwiperSlide
          key={i}
          style={{
            overflow: "visible",
            minWidth: "70px",
            height: "70px",
          }}
          className="w-[70px] h-[70px] color-swipe-slide relative rounded-full"
        >
          {({ isActive }) => (
            <>
              <img
                className="w-[70px] h-[70px] rounded-full"
                src={getConfiguredImage({
                  src:
                    (typeof color.images[0] === "string" && color.images[0]) ||
                    color.images[0].file_path,
                  width: 400,
                  height: 400,
                })}
              />
              {isActive && (
                <span className="regular text-[#3C3C3C] text-[14px] absolute bottom-[-20px] w-full flex justify-center items-center">
                  {color.color_name}
                </span>
              )}
            </>
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
