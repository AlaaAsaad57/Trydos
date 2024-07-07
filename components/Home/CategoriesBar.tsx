import { useState } from "react";
import "styles/skeleton.css";
import { Category } from "models/Category";
import CategoryNavItem from "./CategoryNavItem";
import SearchIcon from "./Search/SearchIcon";
interface CategoriesBarProps {
  forMobile: boolean;
  categories: Category[];
}
function CategoriesBar({ forMobile, categories }: CategoriesBarProps) {
  const [searchEnabled, setSearchEnabled] = useState(false);

  // console.log(categories, "cate");
  return (
    <>
      {!forMobile && (
        <>
          <div className="flex-row search-nav-holder">
            <SearchIcon />
          </div>
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
                slug={category.slug}
                icon={category?.icon}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CategoriesBar;
