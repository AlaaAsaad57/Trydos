"use client";
import ColorsIcon from "public/svg/product/colors.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import React, { useEffect, useState } from "react";
import {
  getConfiguredImage,
  Sendevent,
  translateFunction,
} from "utils/functions";
import "styles/listing.css";
import SquareIcon from "public/svg/product/SquareIcon.svg";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import CircleBorder from "public/svg/product/CircleBorder";
import NormalColorSlider from "./NormalColorSlider";
import { useDispatch, useSelector } from "react-redux";

function ProductColors({ colors, ProductColorsArray }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);

  const activeColor = useSelector(
    (state: StateInterface) => state.details.product?.activeColor
  );
  const setActiveColor = (e) => {
    dispatch({ type: "SET-ACTIVE-COLOR-DETAILS", payload: e });
  };
  const dispatch = useDispatch();
  // const setActiveColor = (e) => {
  //   setActiveColorFunc(e);
  // };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const getSize: (i: number) => number = (i) => {
    return 40;
  };
  useEffect(() => {}, []);

  return (
    <div
      className={`product-colors flex-row align-start relative ${
        extended && "extended-colors-container"
      }`}
      data-cy="AvailableColor"
    >
      {extended && <SquareIcon className="square-icon" />}
      <div className="colors-label flex-row align-center">
        <ColorsIcon data-cy="ColorsIcon" />
        <span style={{ marginLeft: "5px" }} data-cy="Color-Length">
          {translate("Available ")} {colors?.length || 0} {translate("Color")}
        </span>
        <ColorsInfo
          data-cy="QuestionMark"
          style={{ marginLeft: "9px" }}
          onClick={() => {
            dispatch({
              type: "SHOW-INFO-MESSAGE",
              payload: {
                showInfoMessage: true,
                title: `Available ${colors.length} Color`,
                text: "The Colors In The Image Are Intended To Give Approximate Information About The Color Of The Product And 100% Compatibility Is Not Guaranteed. However, The Display And Resolution Of Your Electronic Device There May Be Differences Between The Color Images And The Colors Of The Products Due To The Settings. It Is Technically Possible For An Inevitable Difference To Occur. Trydos Because Of The Difference. Does Not Have Any Liability.",
                icon: "/svg/product/colors.svg",
                value: [],
              },
            });
          }}
        />
      </div>
      <NormalColorSlider
        close={() => setExtended(false)}
        ProductColorsArray={ProductColorsArray}
        colors={colors}
        activeColor={activeColor}
        active={extended}
        setActiveColor={(e) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("color", e.color_name);
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          router.push(pathname + `?${newParams.toString()}`, { shallow: true });
          setActiveColor(e);
        }}
      />
      <div
        className={`colors-row flex-row ${
          extended && "colors-row-extended disable-slider"
        }`}
        style={{ width: `${40 * colors.length - 0.5}px` }}
        onClick={() => {
          setExtended(!extended);
        }}
      >
        <Swiper
          modules={[EffectCoverflow]}
          speed={100}
          effect="coverflow"
          slideToClickedSlide={true}
          coverflowEffect={{
            depth: 100,
            modifier: 1.8,
            scale: 1,
            stretch: 2.5,
            rotate: 0,
            slideShadows: false,
          }}
          slidesPerView={"auto"}
          threshold={1}
          onSlideChange={(e) => {
            Sendevent({
              event: "button_clicked",
              value: "choose_available_color_button",
            });
            const newParams = new URLSearchParams(searchParams);
            newParams.set("color", colors[e.activeIndex].color_name);
            router.push(pathname + `?${newParams.toString()}`, {
              scroll: false,
              // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
              shallow: true,
            });
            setActiveColor(colors[e.activeIndex]);
          }}
          centeredSlides={true}
          initialSlide={
            (searchParams.get("color") &&
              colors.findIndex(
                (s) => s.color_name === searchParams.get("color")
              )) ??
            0
          }
          loop={false}
        >
          {colors?.map((color, index) => (
            <SwiperSlide
              data-cy="SwiperPhoto"
              key={index}
              style={{
                overflow: "visible",
                width: "40px",
                height: "40px",
                position: "relative",
              }}
            >
              {({ isActive }) => (
                <div
                  className={`color-circle relative ${
                    isActive && "active-color-circle"
                  }`}
                >
                  <img
                    width={getSize(index)}
                    height={getSize(index)}
                    src={getConfiguredImage({
                      src: color.images[0],
                      width: getSize(index) * 2,
                      height: getSize(index) * 2,
                    })}
                  />
                  <div className="circel-inset absolute" />
                  <CircleBorder
                    color={
                      isActive
                        ? ProductColorsArray.filter(
                            (s) => s.name === color.color_name
                          )[0].color
                        : "#fff"
                    }
                  />
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default ProductColors;
