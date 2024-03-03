"use client";
import { categories } from "utils/constants";
import { useState } from "react";
import { useSelector } from "react-redux";
import "styles/skeleton.css";
import dynamic from "next/dynamic";
const Skeleton = dynamic(() => import("react-loading-skeleton"), {
  ssr: false,
});
import CategoryNavItem from "./CategoryNavItem";
function CategoriesBar({ forMobile, key }) {
  const loading = useSelector((state) => state.homepage.loading);
  const [searchEnabled, setSearchEnabled] = useState(false);

  return (
    <>
      {((forMobile && window.innerWidth < 912) ||
        (!forMobile && window.innerWidth > 912)) && (
        <div
          className={`categories-bar-container ${forMobile && "mobile-bar"}`}
          style={{ marginLeft: searchEnabled ? "13px" : "50px" }}
        >
          {categories.map((category, key) => (
            <CategoryNavItem
              searchEnabled={searchEnabled}
              close={() => setSearchEnabled(false)}
              openSearch={() => setSearchEnabled(true)}
              name={category.name}
              key={key}
              myKey={key}
              icon={category?.icon}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default CategoriesBar;
