import React, { useEffect } from "react";
import SizeCircle from "./SizeCircle";
function SizeRow() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(".brand-row");
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
    <div className="category-row-container brand-row flex-row">
      <SizeCircle text="S" />
      <SizeCircle text="M" />
      <SizeCircle text="L" />
      <SizeCircle text="XL" />
      <SizeCircle text="XXL" />
    </div>
  );
}

export default SizeRow;
