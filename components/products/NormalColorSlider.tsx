import CircleBorder from "public/svg/product/CircleBorder";
import React, { useEffect } from "react";
import { getConfiguredImage } from "utils/functions";

function NormalColorSlider({
  active,
  colors,
  activeColor,
  setActiveColor,
  ProductColorsArray,
  close,
}) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".normal-color-slider"
      );
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;

        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        // isDown = false;
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  return (
    <div
      className={`normal-color-slider colors-row colors-row-extended ${
        active && "enable-normal-slider"
      }`}
    >
      {colors.map((color, index) => (
        <div
          key={index}
          className={`color-circle relative ${
            activeColor?.color_name === color?.color_name &&
            "active-color-circle"
          }`}
          data-cy="AfterClickOnSwipperPhoto"
          onClick={() => {
            setActiveColor(color);
          }}
        >
          <img
            width={70}
            height={70}
            src={getConfiguredImage({
              src: color.images[0],
              width: 70 * 2,
              height: 70 * 2,
            })}
          />
          <div className="circel-inset absolute" />
          <CircleBorder
            color={
              activeColor?.color_name === color.color_name
                ? ProductColorsArray?.filter(
                    (s) => s.name === color.color_name
                  )?.[0]?.color
                : "#fff"
            }
          />
          <span className="color-name-span ">{color.color_name}</span>
          {color.color_trend && <span className="color-trend">Trend</span>}
        </div>
      ))}
    </div>
  );
}

export default NormalColorSlider;
