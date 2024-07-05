"use client";
import React, { useState } from "react";
import CameraShotIcon from "public/svg/product/CameraShotIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getConfiguredImage } from "utils/functions";
import CircleBorder from "public/svg/product/CircleBorder";
import CamerShotGallery from "./CamerShotGallery";

function CameraShots({ images }) {
  const [active, setActive] = useState(false);

  return (
    <>
      <CamerShotGallery
        active={active}
        images={images}
        close={() => setActive(false)}
      />
      <div
        className={`product-colors flex-row align-start relative`}
        onClick={() => {
          setActive(true);
          window.scrollTo({ top: 0 });
          document.documentElement.style.overflow = "hidden";
        }}
      >
        <div className="colors-label flex-row align-center">
          <CameraShotIcon />
          <span style={{ marginLeft: "5px" }}>Buyers Camera {12} Shot</span>
          <ColorsInfo style={{ marginLeft: "9px" }} />
        </div>

        <div
          className={`colors-row flex-row`}
          style={{ width: `${40 * images.length - 0.5}px` }}
          onClick={() => {}}
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
            initialSlide={Math.round(images.length / 2) - 1}
            loop={false}
          >
            {images.map((image, index) => (
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
                      width={40}
                      height={40}
                      src={getConfiguredImage({
                        src: image,
                        width: 40 * 2,
                        height: 40 * 2,
                      })}
                    />
                    <div className="circel-inset absolute" />
                    <CircleBorder color={isActive ? "#0048AC" : "#fff"} />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
}

export default CameraShots;
