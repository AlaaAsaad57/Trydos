"use client";

import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { useState } from "react";
import { useAppStore } from "store";

function NavbarServer({ lang, mainCategory, categoriesData, children }: any) {
  const [loading, setLoading] = useState(false);
  const categories = categoriesData;
  const { enable_search } = useAppStore();
  categories.sort((a, b) => (a.slug === mainCategory ? -1 : 1));
  const [, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Find the link that was clicked (or the link containing the clicked element)
    const link = (e.target as HTMLElement).closest("a");

    // 2. Check if the link exists and is inside this specific wrapper
    if (link && e.currentTarget.contains(link)) {
      // 3. Extract data from the 'dataset' object
      const { id } = link.dataset;

      console.log("ID from data-id:", id);

      // If you want to prevent the page from actually changing:
      // e.preventDefault();
    }
  };
  return (
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
  );
}

export default NavbarServer;
