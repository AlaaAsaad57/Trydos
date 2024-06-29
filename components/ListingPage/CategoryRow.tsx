"use client";
import React, { useEffect } from "react";
import CategoryCircle from "./CategoryCircle";

function CategoryRow() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".category-row-container"
      );
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
    <div className="category-row-container flex-row">
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
      <CategoryCircle />
    </div>
  );
}

export default CategoryRow;
