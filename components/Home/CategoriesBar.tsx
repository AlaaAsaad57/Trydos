import { useState } from "react";
import "styles/skeleton.css";
import { Category } from "models/Category";
import CategoryNavItem from "./CategoryNavItem";
import SearchIcon from "./Search/SearchIcon";
import { useParams } from "next/navigation";
interface CategoriesBarProps {
  forMobile: boolean;
  categories: any[];
}
function CategoriesBar({ forMobile, categories }: CategoriesBarProps) {
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [active, setActive] = useState(searchParams.mainCategory ?? false);
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
                active={active === category.slug}
                setActive={(e) => setActive(e)}
                searchEnabled={searchEnabled}
                close={() => setSearchEnabled(false)}
                openSearch={() => setSearchEnabled(true)}
                name={category?.name}
                key={key}
                myKey={key}
                slug={category.slug}
                icon={category?.flat_photo_path}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CategoriesBar;
