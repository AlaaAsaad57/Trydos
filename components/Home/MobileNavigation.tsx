import CategoryNavMobile from "./CategoryNavMobile";
import { Category } from "models/Category";
import SearchIcon from "./Search/SearchIcon";
import { useState } from "react";
import { useParams } from "next/navigation";

function MobileNavigation({ categories }: { categories: any[] }) {
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const [activeCategory, setActiveCatgory] = useState(
    searchParams.mainCategory ?? false
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
    <div className="flex-row search-nav-holder">
      <SearchIcon />
      <div className={`categories-bar-container ${"mobile-bar"}`}>
        {categories.map((category, key) => (
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
