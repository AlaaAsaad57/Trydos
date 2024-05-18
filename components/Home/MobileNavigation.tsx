import React from "react";
import Skeleton from "react-loading-skeleton";
import CategoryNavMobile from "./CategoryNavMobile";
import { useSelector } from "react-redux";
import { Category } from "models/Category";

function MobileNavigation() {
  const loading = useSelector((state: any) => state.homepage.loading);
  const categories: Category[] = useSelector(
    (state: any) => state.homepage.categories
  );
  if (typeof document !== "undefined") {
    const slider: HTMLDivElement = document?.querySelector(".mobile-bar");
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
  return (
    <div className={`categories-bar-container ${"mobile-bar"}`}>
      {categories.map((category, key) =>
        loading ? (
          <div className="categories-bar-item" key={key}>
            <div className="categories-bar-item-icon">
              <Skeleton
                duration={0.5}
                count={1}
                circle={true}
                width={"100%"}
                height={"100%"}
              />
            </div>
          </div>
        ) : (
          <CategoryNavMobile
            name={category.name}
            key={key}
            myKey={key}
            icon={category?.icon}
            slug={category.slug}
          />
        )
      )}
    </div>
  );
}

export default MobileNavigation;
