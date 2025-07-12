"use client";

import React, { useState } from "react";
import "styles/cameraShot.css";
import CameraShotIcon from "public/svg/product/CameraShotIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { useSwipeToClose } from "utils/useSwipeToClose";
import GalleryItem from "./GalleryItem";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { CameraShotGalleryPropsType } from "models/componentType/CameraShotGalleryPropsType";

function CameraShotGallery({ images, close }: CameraShotGalleryPropsType) {
  const { activeCameraGallery, showInfoMessage } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);

  // Use the improved swipe-to-close hook
  const {
    ref: swipeRef,
    isDragging,
    isAnimating,
  } = useSwipeToClose({
    threshold: 120, // Minimum distance to trigger close
    velocityThreshold: 0.7, // Minimum velocity to trigger close
    animationDuration: 300,
    onClose: close,
    enabled: activeCameraGallery,
  });

  // useEffect(() => {
  //   const handleWheel = (e) => {
  //     if (activeCameraGallery) scrollToClose(e);
  //   };

  //   window.addEventListener("wheel", handleWheel);
  //   return () => window.removeEventListener("wheel", handleWheel);
  // }, [activeCameraGallery]);

  return (
    <>
      {activeCameraGallery && (
        <>
          <div
            className={`bg-[#1D1D1D] fixed transition-all ${
              activeCameraGallery ? "top-0" : "top-[110vh]"
            } left-0 h-[100vh] min-w-[100vw] z-[9999999999]`}
            onClick={() => {
              if (!isDragging && !isAnimating) {
                close();
              }
            }}
          />
          <div
            className={`flex-col pt-4 rounded-t-[20px] bg-[#FEFEFE] fixed w-full camera-shots-gallery-container z-[999999999999] ${
              activeCameraGallery ? "top-16" : "top-[110vh]"
            } left-0 ${isDragging ? "select-none" : ""}`}
            data-cy="ActiveCaneraGallery"
            data-swipe-container
          >
            {/* Swipe indicator */}
            <div className="w-full flex justify-center pb-2" ref={swipeRef}>
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="gallery-label pl-5 pr-5 flex-row items-center justify-start">
              <CameraShotIcon />
              <span className="regular text-[13px] text-[#8D8D8D] ml-1">
                {translate("Buyers Camera")} 12 {translate("Shot")}
              </span>
              <ColorsInfo
                className="ml-1 cursor-pointer"
                onClick={() => {
                  showInfoMessage({
                    showInfoMessage: true,
                    title: ` ${translate("Buyers Camera")} 12 ${translate(
                      "Shot"
                    )}`,
                    text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
                    icon: "/svg/product/CameraShotIcon.svg",
                    value: ["Birthday", "Casual", "Business"],
                  });
                }}
              />
            </div>
            <span className="pl-12 regular text-[11px] text-[#C4C2C2]">
              {translateFunction(
                "These Shots Are Made By Users Who Have Already Purchased And Received The Product"
              )}
            </span>
            <div
              className={`flex-row flex-wrap w-full h-auto mt-1 container-gallery ${
                extended ? "pl-[10px] pr-[10px]" : "pl-5 pr-5"
              } max-h-[100vh] pb-[200px] overflow-auto`}
              data-cy="GalleryItems"
            >
              {images?.map((s, index) => {
                return (
                  <GalleryItem
                    key={index}
                    onClick={() => {
                      setExtended(!extended);
                    }}
                    extended={extended}
                    name={"Yxxx Oxxx"}
                    avatar={s}
                    image={[s, s, s]}
                    text={
                      "Amazing Product I Buy It And I Saw It Is Good Quality Regarding Price"
                    }
                    date={"12/2/2024"}
                    likes={"110k"}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default CameraShotGallery;
