"use client";
import CategoryNavMobile from "./CategoryNavMobile";
import SearchIcon from "./Search/SearchIcon";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function MobileNavigation({ categories }: { categories: any[] }) {
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const [activeCategory, setActiveCatgory] = useState(
    searchParams.mainCategory ?? false
  );
  const slider: HTMLDivElement = document?.querySelector(".mobile-bar");
  useEffect(() => {
    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    console.log("use effect mobile");
    slider?.addEventListener("mousedown", (e: MouseEvent) => {
      console.log("md");
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider?.addEventListener("mouseleave", () => {
      console.log("ml");

      isDown = false;
      slider.classList.remove("active");
    });
    slider?.addEventListener("mouseup", () => {
      console.log("mu");

      isDown = false;
      slider.classList.remove("active");
    });
    slider?.addEventListener("mousemove", (e) => {
      console.log("mm");

      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 3; //scroll-fast
      slider.scrollLeft = scrollLeft - walk;
    });
  }, [slider]);
  return (
    <div className="flex-row search-nav-holder">
      <SearchIcon />

      <div
        className={`categories-bar-container mobile-bar `}
        data-cy="categoryNavBar"
      >
        {typeof categories !== "string" &&
          categories?.map((category, key) => (
            <CategoryNavMobile
              name={category.name}
              active={activeCategory === category.slug}
              setActive={() => setActiveCatgory(category.slug)}
              key={key}
              myKey={key}
              icon={category?.flat_photo_path?.file_path}
              slug={category.slug}
            />
          ))}
      </div>
    </div>
  );
}

export default MobileNavigation;
