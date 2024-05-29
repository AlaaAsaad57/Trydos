import { useState } from "react";
import "styles/skeleton.css";
import { Category } from "models/Category";
import CategoryNavItem from "./CategoryNavItem";
interface CategoriesBarProps {
  forMobile: boolean;
  categories: Category[];
}
function CategoriesBar({ forMobile, categories }: CategoriesBarProps) {
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
          {categories.map((category, key) => (
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
          ))}
        </div>
      )}
    </>
  );
}

export default CategoriesBar;
