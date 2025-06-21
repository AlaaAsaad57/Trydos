"use client";
import { NormalSizesSliderPropsType } from "models/componentType/NormalSizesSliderPropsType";
import React, { useEffect } from "react";
function NormalSizesSlider({
  active,
  sizes,
  activeColor,
  setActiveColor,

  close,
}: NormalSizesSliderPropsType) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(".sizes-slider");
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
      className={`sizes-slider normal-color-slider colors-row colors-row-extended ${
        active && "enable-normal-slider"
      }`}
      data-cy="SizeSliderBox"
    >
      {sizes.map((size, index) => (
        <div
          key={index}
          className={`color-circle relative ${
            activeColor.includes(size.name) && "active-color-circle"
          }`}
          data-cy="SizeCircle"
          onClick={() => {
            setActiveColor(size.name);
          }}
        >
          <div
            className={`size-circle ${
              activeColor.includes(size.name) && "active-size-circle"
            }`}
          >
            {size.name}
          </div>
          <img src="/svg/product/DashedCircleBorder.svg" />
        </div>
      ))}
    </div>
  );
}

export default NormalSizesSlider;
