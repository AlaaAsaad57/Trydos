import { useRef, useState, useEffect } from "react";
import ImageAvatar from "./ImageAvatar";

import { GetImageUrl } from "utils/tinyUtils";
import { CoverEffectSliderPropsType } from "models/componentType/CoverEffectSliderPropsType";
import { getConfiguredImage } from "utils/functions";
import StackedSlider from "utils/Slider";
function CoverEffectSlider({
  images,
  active,
  activeColor,
  setActiveColor,
  setColor,
  isColorSelected,
  product_name,
  priority,
}: CoverEffectSliderPropsType) {
  const [activeIndex, setActive] = useState(
    images.findIndex((element) => element.color_name === activeColor.color_name)
  );

  const getSize = (i) => {
    if (i === activeIndex || (i === activeIndex && i === 0)) return 35;
    else if (i === activeIndex - 1 || i === activeIndex + 1) return 30;
    else if (i === activeIndex - 2 || i === activeIndex + 2) return 25;
    else if (i === activeIndex - 3 || i === activeIndex + 3) return 20;
    else if (i === activeIndex - 4 || i === activeIndex + 4) return 15;
    else return 15;
  };
  useEffect(() => {}, [isColorSelected]);
  useEffect(() => {}, [activeColor]);
  const throttleFunc = (e) => {
    e.preventDefault();
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

  return (
    <div
      className={
        "product-photos-slider no-navigate overflow-visible flex absolute align-center justify-center max-h[35px]"
      }
      data-cy="productPhotoSlider"
      style={{ opacity: active ? "1" : "0", zIndex: active ? "10" : "1" }}
      onMouseEnter={() => setColor(true)}
      onClick={() => setColor(!isColorSelected)}
    >
      <div className="avatar-slider mx-auto my-0 !w-fit">
        <StackedSlider
          initial_index={0}
          max_drag={100}
          min_scale={0.6}
          max_scale={1}
          onSlideChange={(index) => {
            setActive(index);
            setActiveColor({ ...images[index], index: 0 });
          }}
          overlap_factor={0.4}
          slide_height={35}
          slide_width={35}
          slidesArray={images.map((s, i) => i)}
          renderSlide={({ index, isActive, slide_width }) => {
            let img = images[index];
            return (
              <div
                data-cy="wrapperPhotoSlider"
                key={index}
                onClick={() => {
                  setActive(index);
                  setActiveColor(images[index]);
                }}
                className={`image-avatar bg-white overflow-visible w-100 rounded-50 flex relative cursor-pointer wid-35`}
              >
                <ImageAvatar
                  width={35}
                  height={35}
                  isActive={activeColor.color_name === img.color_name}
                  image={getConfiguredImage({
                    src: GetImageUrl(img.images[0]?.file_path),
                    height: 60,
                  })}
                  name={img.color_name}
                  alt={product_name}
                  priority={priority}
                ></ImageAvatar>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export default CoverEffectSlider;
