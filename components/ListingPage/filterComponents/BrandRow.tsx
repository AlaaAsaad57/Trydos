"use client";
import React, { useEffect } from "react";
import BrandCircle from "./BrandCircle";
import { useSelector } from "react-redux";

function BrandRow() {
  const filters = useSelector((state: any) => state.details.filters);

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
      {filters.brands.map((brand, key) => (
        <BrandCircle brand={brand} key={key} />
      ))}
    </div>
  );
}

export default BrandRow;
