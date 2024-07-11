"use client";
import React, { useEffect } from "react";
import CategoryCircle from "./CategoryCircle";
import { useSelector } from "react-redux";

function CategoryRow() {
  const filters = useSelector((state: any) => state.details.filters);
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
      {filters.categories.map((category, key) => (
        <CategoryCircle key={key} category={category} />
      ))}
    </div>
  );
}

export default CategoryRow;
