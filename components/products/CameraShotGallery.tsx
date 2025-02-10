"use client";

import React, { useEffect, useState } from "react";
import "styles/cameraShot.css";
import CameraShotIcon from "public/svg/product/CameraShotIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { useDispatch, useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import GalleryItem from "./GalleryItem";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
function CameraShotGallery({ images, close }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);
  const activeCameraGallery = useSelector(
    (state: StateInterface) => state.details.activeCameraGallery
  );
  const dispatch = useDispatch();
  var dir = 0;
  const swipeToClose = (e) => {
    let container = document.querySelector(".container-gallery");

    if (container.scrollTop === 0 && Math.abs(e.deltaY) > 50) {
      if (activeCameraGallery === true) {
        close();
      }
    }
  };
  const scrollToClose = (e) => {
    let container = document.querySelector(".container-gallery");

    if (
      container &&
      container.scrollTop === 0 &&
      e.deltaY < 0 &&
      Math.abs(e.deltaY) > 50
    ) {
      close();
    }
  };
  const handlers = useSwipeable({
    onSwipedDown: (e) => {
      swipeToClose(e);
    },

    delta: 10,
    trackMouse: true,
    trackTouch: true,

    touchEventOptions: {
      passive: false,
    },
  });
  useEffect(() => {
    window.addEventListener("wheel", function (e) {
      if (activeCameraGallery) scrollToClose(e);
    });
  }, []);
  return (
    <>
      {activeCameraGallery && (
        <>
          <div
            className={`bg-[#1D1D1D] fixed transition-all ${
              activeCameraGallery ? "top-0" : "top-[110vh]"
            } left-0 h-[100vh] min-w-[100vw] z-[9999999999]`}
            onClick={() => {
              close();
            }}
          />
          <div
            {...handlers}
            className={`flex-col pt-4  rounded-t-[20px] bg-[#FEFEFE] fixed w-full camera-shots-gallery-container z-[999999999999] ${
              activeCameraGallery ? "top-16" : "top-[110vh]"
            } left-0`}
          >
            <div className="gallery-label pl-5 pr-5 flex-row items-center justify-start ">
              <CameraShotIcon />
              <span className="regular text-[13px] text-[#8D8D8D] ml-1">
                {translate("Buyers Camera")} 12 {translate("Shot")}
              </span>
              <ColorsInfo
                className="ml-1 cursor-pointer"
                onClick={() => {
                  dispatch({
                    type: "SHOW-INFO-MESSAGE",
                    payload: {
                      showInfoMessage: true,
                      title: ` ${translate("Buyers Camera")} 12 ${translate(
                        "Shot"
                      )}`,
                      text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
                      icon: "/svg/product/CameraShotIcon.svg",
                      value: ["Birthday", "Casual", "Business"],
                    },
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
            >
              {images?.map((s, index) => {
                return (
                  <GalleryItem
                    key={index}
                    onClick={() => setExtended(!extended)}
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
