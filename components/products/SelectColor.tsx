"use client";
import React, { useEffect, useRef } from "react";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import CartIcon from "public/svg/CartIcon.svg";

import { getConfiguredImage, Sendevent } from "utils/functions";
import BackIcon from "public/svg/listing/backIcon.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { useAppStore } from "store";

function SelectColor({ close }) {
  const {
    enableCart,
    disableAddToCartOption,
    localCart,

    AddToCartOption,
    SelectedProduct,
  } = useAppStore();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const enableCartAction = (s) => {
    disableAddToCartOption();
    window.history.pushState({ isPopup: true }, "open Cart");
    enableCart(s);
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
  };

  return (
    <>
      <div className="blur-md bg-[#f4f4f480] backdrop-blur-[10px] flex fixed top-0 left-0 h-full w-full z-[999999999]" />

      <div className="back-bar align-center w-100 flex-row min-h-12 bg-[#fff] p-4 z-[9999999999] fixed top-0 justify-between">
        <div
          className="back-icon p-0"
          data-cy="BackIcon-WhenAddFromProductDetails"
          onClick={() => {
            document.documentElement.style.overflow = "auto";
            document.documentElement.scrollTop = 0;
            close();
            disableAddToCartOption();
          }}
        >
          <BackIcon />
        </div>
        <span
          className="relative"
          onClick={() => {
            disableAddToCartOption();
            close();
            enableCartAction(true);
          }}
        >
          {localCart?.length > 0 && (
            <span className="bg-green-500 right-[-8px] top-[-4px] text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
              {localCart.length}
            </span>
          )}
          <CartIcon
            id="cart-icon"
            className="cart-icon"
            data-cy="CartIcon_Productpage"
          />
        </span>
      </div>
      <div
        style={{ height: "calc(100vh - 461px)" }}
        className="flex-col mt-[10px] w-full fixed  left-0 z-[9999999999] top-[50px] items-center"
      >
        <ToastContainer
          position="top-right"
          style={{ zIndex: "9999999999999999" }}
        />
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
                // @ts-ignore
                (AddToCartOption?.selectedColor?.images &&
                  // @ts-ignore
                  AddToCartOption?.selectedColor?.images[0]) ||
                (SelectedProduct?.images && SelectedProduct?.images[0]),
            })}
            alt="add to cart icon"
            className={
              "min-h-[80px] h-full object-top rounded-[15px] moved-img "
            }
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
  const { addToCartColor, AddToCartOption } = useAppStore();

  const router = useRouter();
  const pathname = usePathname();
  const setActive = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("color", e.color_name);
    router.push(pathname + `?${newParams.toString()}`, {
      scroll: false,
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      shallow: true,
    });
    addToCartColor(e);
    Sendevent({ event: "button_clicked", value: "slide_choose_color_event" });
  };
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("color")) {
      let color = colors.filter(
        (s) => s.color_name === searchParams.get("color")
      )[0];
      if (color) addToCartColor(color);
    }
  }, []);
  const activeColor = AddToCartOption.selectedColor;

  const getInitial = () => {
    if (searchParams.get("color")) {
      let index = 0;
      colors.map((s, i) => {
        if (s.color_name === searchParams.get("color")) index = i;
      });
      return index;
    } else if (activeColor) {
      let index = 0;
      colors.map((s, i) => {
        // @ts-ignore
        if (s.color_name === activeColor.color_name) index = i;
      });
      return index;
    }

    return 0;
  };
  const ref = useRef<SwiperRef>();
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
      initialSlide={0}
      threshold={1}
      centeredSlides={false}
      loop={false}
      ref={ref}
    >
      {colors?.map((color, i) => (
        <SwiperSlide
          onClick={() => {
            ref.current.swiper.slideTo(i, 400, false);
            setActive(color);
          }}
          key={i}
          style={{
            overflow: "visible",
            minWidth: "70px",
            height: "70px",
          }}
          className="w-[70px] h-[70px] color-swipe-slide bg-white relative rounded-full"
        >
          {({ isActive }) => (
            <>
              <img
                className="w-[70px] h-[70px] rounded-full bg-white"
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
