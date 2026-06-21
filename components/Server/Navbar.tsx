"use client";

import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { useState, useEffect } from "react";
import { useAppStore } from "store";

function NavbarServer({ lang, mainCategory, categoriesData, children }: any) {
  const [loading, setLoading] = useState(false);
  const categories = categoriesData;
  const { enable_search } = useAppStore();
  categories.sort((a, b) => (a.slug === mainCategory ? -1 : 1));
  const [, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const container = document.getElementById("categories-bar-container");
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScrollLeft = scrollWidth - clientWidth;

      // No (meaningful) overflow: hide both affordances. The ~1px tolerance
      // avoids sub-pixel flicker when the bar "exactly fits".
      if (maxScrollLeft <= 1) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      if (isRtl) {
        // RTL: scrollLeft starts at 0 (rightmost) and decreases toward
        // -maxScrollLeft (leftmost). Compare against the absolute distance.
        setCanScrollLeft(Math.abs(scrollLeft) < maxScrollLeft - 1);
        setCanScrollRight(Math.abs(scrollLeft) > 1);
      } else {
        // LTR: scrollLeft starts at 0 (leftmost) and increases toward
        // maxScrollLeft (rightmost).
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(scrollLeft < maxScrollLeft - 1);
      }
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    // Re-check once layout has settled (late content / async sizing).
    const timer = setTimeout(updateScrollState, 300);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [categoriesData, isRtl]);

  const scrollByAmount = (amount: number) => {
    const container = document.getElementById("categories-bar-container");
    if (container) {
      container.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Find the link that was clicked (or the link containing the clicked element)
    const link = (e.target as HTMLElement).closest("a");

    // 2. Check if the link exists and is inside this specific wrapper
    if (link && e.currentTarget.contains(link)) {
      // 3. Extract data from the 'dataset' object
      // If you want to prevent the page from actually changing:
      // e.preventDefault();
    }
  };
  return (
    <div className="relative flex-1 min-w-0 max-w-[910px]">
      {/* Leading-edge blur fade + scroll arrow */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[60px] bg-gradient-to-r from-white via-white/70 to-transparent pointer-events-none flex items-center justify-start pl-1.5 z-20 transition-opacity duration-300 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => scrollByAmount(-200)}
          className={`w-7 h-7 rounded-full bg-transparent shadow-none flex items-center justify-center border border-none active:scale-95 transition-all cursor-pointer ${
            canScrollLeft ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-label="Scroll categories left"
          aria-hidden={!canScrollLeft}
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <HortiznalScrollBar
        onClick={handleWrapperClick}
        id="categories-bar-container"
        className={`categories-bar-container m-0 max-w-[900px] pl-2 pr-2 overflow-x-scroll overflow-y-hidden min-h-[47px] bg-white pt-2 z-10 whitespace-nowrap flex  ${
          loading && "opacity-75"
        } ${isRtl ? "flex-row-reverse" : "flex-row"} ${enable_search && "p-0"}`}
        dataCy="categoryNavBar"
      >
        {children}
      </HortiznalScrollBar>

      {/* Trailing-edge blur fade + scroll arrow */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-[60px] bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none flex items-center justify-end pr-1.5 z-20 transition-opacity duration-300 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => scrollByAmount(200)}
          className={`w-7 h-7 rounded-full bg-transparent shadow-none flex items-center justify-center border-none active:scale-95 transition-all cursor-pointer ${
            canScrollRight ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-label="Scroll categories right"
          aria-hidden={!canScrollRight}
          tabIndex={canScrollRight ? 0 : -1}
        >
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default NavbarServer;
