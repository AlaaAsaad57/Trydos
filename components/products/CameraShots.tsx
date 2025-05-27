"use client";
import React, { useState } from "react";
import CameraShotIcon from "public/svg/product/CameraShotIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  getConfiguredImage,
  Sendevent,
  translateFunction,
} from "utils/functions";

import CameraShotGallery from "./CameraShotGallery";
import CircleBorder from "public/svg/product/CircleBorder";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { GA_CLICK_EVENT_VALUES, GA_EVENT_NAMES } from "utils/GAEvents";

function CameraShots({ images }) {
  const { setActiveCameraGallery, showInfoMessage } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };

  return (
    <>
      <CameraShotGallery
        close={() => {
          setActiveCameraGallery(false);
          document.documentElement.style.overflow = "initial";
        }}
        images={images}
      />
      <div
        className={`product-colors flex-row align-start relative`}
        data-cy="CameraProduct"
        onClick={() => {
          Sendevent({
            event: GA_EVENT_NAMES.CLICK,
            value: GA_CLICK_EVENT_VALUES.SHOW_BUYERS_CAMERA_BUTTON,
          });
          setActiveCameraGallery(true);
          window.scrollTo({ top: 0 });
          document.documentElement.style.overflow = "hidden";
        }}
      >
        <div className="colors-label flex-row align-center">
          <CameraShotIcon data-cy="CameraIcon" />
          <span style={{ marginLeft: "5px" }}>
            {translate("Buyers Camera")} {12} {translate("Shot")}
          </span>
          <ColorsInfo
            data-cy="QuestionMark"
            style={{ marginLeft: "9px" }}
            onClick={() => {
              Sendevent({
                event: GA_EVENT_NAMES.CLICK,
                value: GA_CLICK_EVENT_VALUES.SHOW_BUYERS_CAMERA_INFO_MESSAGE,
              });
              showInfoMessage({
                showInfoMessage: true,
                title: ` ${translate("Buyers Camera")} 12 ${translate("Shot")}`,
                text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
                icon: "/svg/product/CameraShotIcon.svg",
                value: ["Birthday", "Casual", "Business"],
              });
            }}
          />
        </div>

        <div
          className={`colors-row flex-row justify-end w-auto`}
          onClick={() => {}}
        >
          <Swiper
            modules={[EffectCoverflow]}
            speed={100}
            effect="coverflow"
            className="max-w-[218px]"
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
            initialSlide={Math.round(images?.length / 2) - 1}
            loop={false}
          >
            {images?.map((image, index) => (
              <SwiperSlide
                data-cy="SwiperPhoto1"
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
