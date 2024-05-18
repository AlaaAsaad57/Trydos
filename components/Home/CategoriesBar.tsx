"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import "styles/skeleton.css";
import dynamic from "next/dynamic";
import { Category } from "models/Category";
const Skeleton = dynamic(() => import("react-loading-skeleton"), {
  ssr: false,
});
const CategoryNavItem = dynamic(() => import("./CategoryNavItem"), {
  ssr: false,
});
interface CategoriesBarProps {
  forMobile: boolean;
}
function CategoriesBar({ forMobile }: CategoriesBarProps) {
  const loading = useSelector((state: any) => state.homepage.loading);
  const categories: Category[] = useSelector(
    (state: any) => state.homepage.categories
  );
  const [searchEnabled, setSearchEnabled] = useState(false);

  return (
    <>
      {!forMobile && (
        <div
          className={`categories-bar-container ${
            forMobile &&
            "mobile-bar cursor-pointer pr-[5px] overflow-x-scroll overflow-y-hidden whitespace-nowrap"
          }`}
          style={{ marginLeft: searchEnabled ? "13px" : "50px" }}
        >
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
              <CategoryNavItem
                searchEnabled={searchEnabled}
                close={() => setSearchEnabled(false)}
                openSearch={() => setSearchEnabled(true)}
                name={category.name}
                key={key}
                myKey={key}
                slug={category.slug}
                icon={category?.icon}
              />
            )
          )}
        </div>
      )}
    </>
  );
}

export default CategoriesBar;
