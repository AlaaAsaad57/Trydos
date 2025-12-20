"use client";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { NavbarServerProps } from "models/componentType/HomePagePropsType";
import { useState } from "react";
import { useAppStore } from "store";

function NavbarServer({
  lang,
  mainCategory,
  categoriesData,
  children,
}: NavbarServerProps) {
  const [activeCategory, setActiveCategory] = useState(mainCategory);
  const [loading, setLoading] = useState(false);
  const categories = categoriesData;
  const { enable_search } = useAppStore();
  categories.sort((a, b) => (a.slug === mainCategory ? -1 : 1));
  const [, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <HortiznalScrollBar
      onClick={(e) => {
        console.log(e.target);
      }}
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
