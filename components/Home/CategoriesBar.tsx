import { useState } from "react";
import "styles/skeleton.css";
import CategoryNavItem from "./CategoryNavItem";
import SearchIcon from "./Search/SearchIcon";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

interface CategoriesBarProps {
  forMobile: boolean;
  categories: any[];
}
function CategoriesBar({ forMobile, categories }: CategoriesBarProps) {
  const { setEnableSearch, enable_search } = useAppStore();
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const [active, setActive] = useState(searchParams.mainCategory ?? false);
  const setSearchEnabled = (e) => {
    setEnableSearch(e);
  };
  return (
    <>
      {!forMobile && (
        <>
          <div className="flex-row search-nav-holder">
            <SearchIcon />
          </div>
          <div
            className={`categories-bar-container ${forMobile && "mobile-bar"}`}
            style={{ marginLeft: enable_search ? "13px" : "50px" }}
          >
            {!enable_search &&
              categories?.map((category, key) => (
                <CategoryNavItem
                  active={active === category.slug}
                  setActive={(e) => setActive(e)}
                  searchEnabled={enable_search}
                  close={() => setSearchEnabled(false)}
                  openSearch={() => setSearchEnabled(true)}
                  name={category?.name}
                  key={key}
                  myKey={key}
                  slug={category.slug}
                  icon={category?.flat_photo_path?.file_path}
                />
              ))}
          </div>
        </>
      )}
    </>
  );
}

export default CategoriesBar;
