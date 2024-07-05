"use client";
import ColorsIcon from "public/svg/product/colors.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import React, { useState } from "react";
import { getConfiguredImage } from "utils/functions";
import "styles/listing.css";
import SquareIcon from "public/svg/product/SquareIcon.svg";

import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import CircleBorder from "public/svg/product/CircleBorder";
import NormalColorSlider from "./NormalColorSlider";
function ProductColors({ colors, ProductColorsArray }) {
  const [extended, setExtended] = useState(false);
  const [activeColor, setActiveColorFunc] = useState([]);
  const setActiveColor = (e) => {
    if (activeColor.includes(e)) {
      setActiveColorFunc(activeColor.filter((s) => s !== e));
    } else {
      setActiveColorFunc([...activeColor, e]);
    }
  };
  const getSize: (i: number) => number = (i) => {
    return 40;
  };
  return (
    <div
      className={`product-colors flex-row align-start relative ${
        extended && "extended-colors-container"
      }`}
    >
      {extended && <SquareIcon className="square-icon" />}
      <div className="colors-label flex-row align-center">
        <ColorsIcon />
        <span style={{ marginLeft: "5px" }}>
          Available {colors.length} Color
        </span>
        <ColorsInfo style={{ marginLeft: "9px" }} />
      </div>
      <NormalColorSlider
        close={() => setExtended(false)}
        ProductColorsArray={ProductColorsArray}
        colors={colors}
        activeColor={activeColor}
        active={extended}
        setActiveColor={(e) => setActiveColor(e)}
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
          centeredSlides={true}
          initialSlide={Math.round(colors.length / 2) - 1}
          loop={false}
        >
          {colors.map((color, index) => (
            <SwiperSlide
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
