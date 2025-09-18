"use client";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import SearchIcon from "../Home/Search/SearchIcon";
import CategoryNavMobile from "components/Home/CategoryNavMobile";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

import { NavbarServerProps } from "models/componentType/HomePagePropsType";
import { useState } from "react";
import { useAppStore } from "store";

function NavbarServer({
  lang,
  mainCategory,
  categoriesData,
  time,
}: NavbarServerProps) {
  try {
    const [activeCategory, setActiveCategory] = useState(mainCategory);
    const [loading, setLoading] = useState(false);
    const categories = categoriesData;
    const { enable_search } = useAppStore();
    categories.sort((a, b) => (a.slug === mainCategory ? -1 : 1));
    const [, language] = lang.split("-");
    const isRtl = language === "ar" || language === "ku";

    return (
      <HortiznalScrollBar
        id="categories-bar-container"
        className={`categories-bar-container m-0 max-w-[900px] pl-2 pr-2 overflow-x-scroll overflow-y-hidden min-h-[47px] bg-white pt-2 z-10 whitespace-nowrap flex  ${
          loading && "opacity-75"
        } ${isRtl ? "flex-row-reverse" : "flex-row"} ${enable_search && "p-0"}`}
        dataCy="categoryNavBar"
      >
        {typeof categories !== "string" &&
          categories?.map((category, key) => (
            <div
              className="flex"
              key={key}
              onClick={() => {
                setLoading(true);
                setActiveCategory(category?.slug);
              }}
            >
              <CategoryNavMobile
                params={{ lang, mainCategory }}
                name={category.name}
                active={
                  activeCategory === category.slug ||
                  (mainCategory === category.slug &&
                    activeCategory === category?.slug)
                }
                key={key}
                myKey={key}
                icon={category?.flat_photo_path?.file_path}
                outline={category?.outline_photo_path?.file_path}
                slug={category.slug}
              />
            </div>
          ))}
      </HortiznalScrollBar>
    );
  } catch (error) {
    console.error("Error loading navbar:", error);
    return <MobileNavigationSkeleton />;
  }
}

export default NavbarServer;
