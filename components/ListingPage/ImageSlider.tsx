import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import BorderImage from "./BorderImage";
import Image from "next/image";
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
            setActiveImage({ ...activeColor, index: swiper.activeIndex });
          }}
          initialSlide={activeColor.index}
          loop={false}
        >
          {activeColor.images.map((img, i) => (
            <SwiperSlide
              key={i}
              style={{
                overflow: "visible",
                position: "relative",
              }}
            >
              {({ isActive }) => (
                <>
                  <BorderImage isBig={true} />
                  <div className="inset-shadow-img w-100 h-100 rounded-15 absolute" />
                  <Image
                    loading={priority && i === 0 ? "eager" : "lazy"}
                    priority={priority && i === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ borderRadius: "15px", zIndex: "3" }}
                    fill
                    unoptimized
                    src={getConfiguredImage({
                      src: img,
                      width: 400,
                      height: 400,
                    })}
                    quality={100}
                    alt={product_name || "alt"}
                  />
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
