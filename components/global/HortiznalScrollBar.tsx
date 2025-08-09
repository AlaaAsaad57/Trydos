"use client";
import { HortiznalScrollBarProps } from "models/componentType/HomePagePropsType";
import React, { useEffect } from "react";

function HortiznalScrollBar({
  className,
  children,
  id,
  dataCy,
  time,
}: HortiznalScrollBarProps) {
  useEffect(() => {
    if (time) {
      console.log(time);
    }
    if (typeof window !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(`#${id}`);
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
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
      id={id}
      className={`${className} overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none`}
      data-cy={dataCy}
    >
      {children}
    </div>
  );
}

export default HortiznalScrollBar;
