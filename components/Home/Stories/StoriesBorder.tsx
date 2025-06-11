"use client";
import React, { useEffect, useState } from "react";

function StoriesBorder() {
  const [show, setShow] = useState(false);
  const getBorderWidth = (): number => {
    if (typeof window === "undefined") return null;
    let elem =
      typeof document !== "undefined" &&
      document.querySelector(".site-container");
    if (elem?.clientWidth < 1443) return elem?.clientWidth;
    else return 1433;
  };
  if (typeof document !== "undefined") {
    const slider: HTMLDivElement = document?.querySelector(".stories-bars");
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
      // Sendevent({
      //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
      //   value: GA_PROGRAMMING_EVENT_VALUES.SCROLL_STORIES_IN_HOME_EVENT,
      // });
    });
  }
  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <>
      {show && (
        <svg
          id="stories-border2"
          className="border"
          xmlns="http://www.w3.org/2000/svg"
          width={getBorderWidth()}
          height="0.5"
        >
          <line
            id="Line_1107"
            data-name="Line 1107"
            x2={getBorderWidth()}
            transform="translate(0 0.25)"
            fill="none"
            stroke="#3c3c3c"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        </svg>
      )}
    </>
  );
}

export default StoriesBorder;
