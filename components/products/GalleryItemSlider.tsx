import React, { useRef, useState } from "react";
import { getConfiguredImage } from "utils/functions";
import "styles/listing.css";
import { GetImageUrl } from "utils/tinyUtils";
import { GalleryItemSliderPropsType } from "models/componentType/GalleryItemSliderPropsType";
import { NormalSlider } from "utils/Slider";
function GalleryItemSlider({ images, extended }: GalleryItemSliderPropsType) {
  const [active, setActive] = useState(0);
  return (
    <div className="relative flex-col ">
      {images.length > 0 && (
        <PointsSlider images={images} activeIndex={active} />
      )}

      <NormalSlider
        slideHeight={extended ? 595 : 276}
        slideWidth={extended ? Math.min(window.innerWidth, 1300) : 185}
        slidesArray={images.map((img, i) => i)}
        onSlideChange={(index) => {
          setActive(index);
        }}
        parentClassName={`w-[${
          extended ? Math.min(window.innerWidth, 1300) : 185
        }px] h-[${extended ? 595 : 276}px] flex`}
        renderSlide={({ index, slide, isActive }) => {
          let img = images[index];
          return (
            <>
              <svg
                className="absolute top-0 left-0 z-50"
                xmlns="http://www.w3.org/2000/svg"
                width="calc(100% - 1px)"
                height="calc(100%)"
              >
                <g
                  id="Rectangle_5686"
                  data-name="Rectangle 5686"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="0.5"
                >
                  <rect width="100%" height="100%" rx="30" stroke="none" />
                  <rect
                    x="0.25"
                    y="0.25"
                    width="calc(100% - 1px)"
                    height="calc(100%)"
                    rx="29.75"
                    fill="none"
                  />
                </g>
              </svg>

              <div className="inset-shadow-img w-100 h-100 rounded-[30px] absolute z-40" />
              <img
                className="w-full max-h-[595px] rounded-[30px]"
                src={
                  extended
                    ? getConfiguredImage({
                        src: GetImageUrl(img),
                        width: 700,
                        height: 700,
                      })
                    : getConfiguredImage({
                        src: GetImageUrl(img),
                        width: 400,
                        height: 400,
                      })
                }
              />
            </>
          );
        }}
        threshold={0.31}
      />
    </div>
  );
}
function PointsSlider({
  activeIndex,
  images,
}: {
  activeIndex: number;
  images: any[];
}) {
  const getSize = (i) => {
    if (i === activeIndex || (i === activeIndex && i === 0)) return 6;
    else if (i === activeIndex - 1 || i === activeIndex + 1) return 4;
    else return 2;
  };

  return (
    <>
      <div className="top-slider-enable align-center flex absolute justify-center cursor-pointer">
        {images.map((img, i) => (
          <div
            key={i}
            className={`slider-point-item rounded-50 relative wid-${getSize(
              i
            )} ${activeIndex === i && "active-point-item"}`}
          >
            {getSize(i) === 2 ? (
              <svg
                className="absolute"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="2"
                height="2"
              >
                <g>
                  <g stroke="#3c3c3c" strokeWidth="0.3">
                    <circle cx="1" cy="1" r="0.85" fill="none" />
                  </g>
                </g>
              </svg>
            ) : getSize(i) === 4 ? (
              <svg
                className="absolute"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="4"
                height="4"
              >
                <g>
                  <g stroke="#3c3c3c" strokeWidth="0.3">
                    <circle cx="2" cy="2" r="1.85" fill="none" />
                  </g>
                </g>
              </svg>
            ) : (
              getSize(i) === 6 && (
                <svg
                  className="absolute"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="6"
                  height="6"
                >
                  <g>
                    <g
                      id="Ellipse_4-2"
                      data-name="Ellipse 4"
                      fill="none"
                      stroke="#3c3c3c"
                      strokeWidth="0.3"
                    >
                      <circle cx="3" cy="3" r="2.85" fill="none" />
                    </g>
                  </g>
                </svg>
              )
            )}
          </div>
        ))}
      </div>
    </>
  );
}
export default GalleryItemSlider;
