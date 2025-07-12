"use client";
import React from "react";
import CameraShotIcon from "public/svg/product/CameraShotIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";

import { getConfiguredImage, translateFunction } from "utils/functions";

import CameraShotGallery from "./CameraShotGallery";
import CircleBorder from "public/svg/product/CircleBorder";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

import { GetImageUrl } from "utils/tinyUtils";
import { CameraShotsPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import StackedSlider from "utils/Slider";

function CameraShots({ images }: CameraShotsPropsType) {
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
        onClick={(e) => {
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.SHOW_BUYERS_CAMERA_BUTTON,
          // });
          if ((e.target as HTMLDivElement).classList.contains("slider_slide")) {
            return;
          }
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
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHOW_BUYERS_CAMERA_INFO_MESSAGE,
              // });
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
          className={`colors-row flex-row justify-end w-[120px] slider_slide`}
          onClick={() => {}}
        >
          <StackedSlider
            initial_index={Math.round(images?.length / 2) - 1}
            slidesArray={images?.map((s, i) => i)}
            max_drag={100}
            max_scale={1}
            min_scale={0.6}
            overlap_factor={0.4}
            onSlideChange={(index) => {}}
            slide_width={40}
            threshold={0.4}
            renderSlide={({ index, isActive, slide_width }) => {
              let image = images[index];
              return (
                <div
                  className={`color-circle relative ${
                    isActive && "active-color-circle"
                  }`}
                >
                  <img
                    width={40}
                    height={40}
                    src={getConfiguredImage({
                      src: GetImageUrl(image),
                      width: 40 * 2,
                      height: 40 * 2,
                    })}
                  />
                  <div className="circel-inset absolute" />
                  <CircleBorder color={isActive ? "#0048AC" : "#fff"} />
                </div>
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

export default CameraShots;
