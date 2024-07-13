"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import BackBar from "./BackBar";

function SelectColor({ active, photos, close }) {
  const AddToCartOption = useSelector(
    (state: any) => state.details.AddToCartOption
  );
  const dispatch = useDispatch();
  return (
    <>
      <div className="blur-md bg-[#f4f4f480] backdrop-blur-[10px] flex fixed top-[103px] left-0 h-full w-full z-[99]" />
      <div className="w-full fixed top-[55px] lef-0 z-[999999999999999]">
        <BackBar
          link={false}
          close={() => {
            close();
            dispatch({ type: "AddToCartOptionDisable", payload: false });
          }}
        />
      </div>
      <div className="flex-col mt-[10px] w-full fixed  left-0 z-[999] top-[103px] items-center">
        <div className="flex-row w-auto justify-center h-available relative rounded-[15px] inset-select-shadow-image">
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
            src={
              (AddToCartOption?.selectedColor?.images &&
                AddToCartOption?.selectedColor?.images[0]) ||
              photos[0]?.images[0]
            }
            className={"h-full object-top rounded-[15px]"}
          />
        </div>
        <div className="flex  w-full max-w-[420px] ">
          <SelectColorsSlider colors={photos} />
        </div>
      </div>
    </>
  );
}

export default SelectColor;
const SelectColorsSlider = ({ colors }) => {
  const dispatch = useDispatch();
  const setActive = (e) => {
    dispatch({ type: "AddToCartColor", payload: e });
  };
  return (
    <Swiper
      modules={[EffectCoverflow]}
      speed={100}
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
      centeredSlides={true}
      loop={false}
    >
      {colors.map((color, i) => (
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
                src={color.images[0]}
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
