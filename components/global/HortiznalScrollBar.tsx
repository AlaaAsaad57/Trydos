"use client";

import React, { useEffect } from "react";

function HortiznalScrollBar({
  className = "",
  children = <></>,
  id = null,
  dataCy = "",
  time = "",
  onClick = (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => {},
}: any) {
  useEffect(() => {
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
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
      id={id}
      className={`${className} horizntal-scroll overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      data-pw={dataCy}
    >
      {children}
    </div>
  );
}

export default HortiznalScrollBar;
