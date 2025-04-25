"use client";
import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { useRef } from "react";
import PointsSlider from "./PointsSlider";
import { getConfiguredImage } from "utils/functions";

function ImageSlider({
  renderVar,
  product_name,
  active,
  isColorSelected,
  setActiveImage,
  activeColor,
  isActiveTopSlide,
  setActiveTopSlide,
  setColor,
  priority,
}: {
  renderVar: boolean;
  product_name: string;
  active: boolean;
  isColorSelected: boolean;
  setActiveImage: Function;
  activeColor: any;
  isActiveTopSlide: boolean;
  setActiveTopSlide: Function;
  setColor: Function;
  priority: boolean;
}) {
  var ColorRef = useRef<any>();
  useEffect(() => {
    if (activeColor.index >= 0) {
      ColorRef.current.slideTo(activeColor.index, 300, false);
    }
  }, [activeColor]);
  return (
    <>
      <div
        className={"active-slider " + (active ? "sl-active" : "sl-deactive")}
      >
        {!isColorSelected && (
          <PointsSlider
            key={product_name}
            colors={activeColor.images}
            activeIndex={ColorRef.current?.activeIndex || 0}
            isActiveTopSlide={isActiveTopSlide}
            setActiveTopSlide={() => {
              setActiveTopSlide(!isActiveTopSlide);
              setColor(true);
            }}
          />
        )}

        <Swiper
          effect="coverflow"
          id={product_name}
          className="overflow-hidden"
          coverflowEffect={{
            depth: 100,
            modifier: 1,
            scale: 0.78,
            stretch: 135,
            slideShadows: false,
          }}
          ref={ColorRef}
          threshold={1}
          onInit={(swiper) => {
            ColorRef.current = swiper;
          }}
          speed={100}
          slidesPerView={1}
          centeredSlides={true}
          onSlideChange={(swiper) => {
            setTimeout(() => {
              // stopProgress(true);
            }, 300);

            setActiveImage({ ...activeColor, index: swiper.activeIndex });
          }}
          initialSlide={activeColor.index}
          loop={false}
        >
          {activeColor?.images?.map((img, i) => (
            <SwiperSlide
              key={i}
              style={{
                overflow: "visible",
                position: "relative",
              }}
              className="bg-white"
            >
              {({ isActive }) => (
                <>
                  {/* <BorderImage isBig={true} /> */}
                  <div className="inset-shadow-img w-100 h-100 rounded-15 absolute" />
                  {(isActive || i === 0) && (
                    <img
                      loading={priority && i === 0 ? "eager" : "lazy"}
                      fetchPriority={priority && i === 0 ? "high" : "low"}
                      style={{ borderRadius: "15px", zIndex: "3" }}
                      src={getConfiguredImage({
                        src: img.file_path,
                        width: 400,
                        height: 400,
                      })}
                      key={`${product_name}-${i}`}
                      alt={product_name || "alt"}
                    />
                  )}
                </>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

export default ImageSlider;
