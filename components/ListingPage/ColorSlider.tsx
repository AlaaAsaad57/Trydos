import { useRef, useEffect } from "react";
import BorderImage from "./BorderImage";

import { getConfiguredImage } from "utils/functions";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { ColorSliderPropsType } from "models/componentType/ColorSliderPropsType";
import StackedSlider from "utils/Slider";

function ColorSlider({
  active,
  activeColor,
  setActiveColor,
  getIndex,
  colors,
  product_name,
  priority,
}: ColorSliderPropsType) {
  const ImageRef = useRef<any>();
  useEffect(() => {
    if (activeColor && ImageRef) {
      ImageRef.current?.slideTo(getIndex, 300, false);
    }
  }, [activeColor]);
  const throttleFunc = (e) => {
    e.preventDefault();
    if (e.deltaX > 5) {
      ImageRef.current.slideNext();
    } else if (e.deltaX < 0 && Math.abs(e.deltaX) > 5) {
      ImageRef.current.slidePrev();
    }
  };
  function throttle(fn, wait) {
    var time = Date.now();

    return function (event) {
      // we dismiss every wheel event with deltaY less than 4
      if (Math.abs(event.deltaX) < 4) return;

      if (time + wait - Date.now() < 0) {
        fn(event);
        time = Date.now();
      }
    };
  }

  function callback(event) {
    throttleFunc(event);
  }
  return (
    <div
      className={
        "active-slider overflow-hidden " +
        (active ? "sl-active" : "sl-deactive")
      }
      onWheel={throttle(callback, 250)}
    >
      <StackedSlider
        className="color-swiper h-[256px] w-[200px]"
        initial_index={getIndex}
        max_drag={100}
        min_scale={0.8}
        max_scale={1}
        overlap_factor={0.5}
        active_index={getIndex}
        onSlideChange={(index) => {
          setActiveColor({ ...colors[index], index: 0 });
        }}
        slide_width={170}
        slide_height={246}
        slidesArray={colors.map((img, i) => i)}
        renderSlide={({ index, isActive, slide_width }) => {
          let img = colors[index];
          return (
            <div
              key={index}
              style={{
                overflow: "visible",
                position: "relative",
                flex: 1,
              }}
              className="bg-white flex "
            >
              <>
                <BorderImage isBig={false} />
                <div className="inset-shadow-img rounded-15 absolute w-100 h-100" />
                <Image
                  loading="eager"
                  fetchPriority="auto"
                  style={{ borderRadius: "15px", zIndex: "3" }}
                  width={400}
                  height={300}
                  className="flex-1"
                  src={getConfiguredImage({
                    src: GetImageUrl(img.images[0].file_path),
                    width: 400,
                    height: 400,
                  })}
                  alt={product_name || "alt"}
                />
              </>
            </div>
          );
        }}
      />
    </div>
  );
}

export default ColorSlider;
