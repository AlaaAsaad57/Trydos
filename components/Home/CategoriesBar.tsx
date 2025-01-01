import { useState } from "react";
import "styles/skeleton.css";
import { Category } from "models/Category";
import CategoryNavItem from "./CategoryNavItem";
import SearchIcon from "./Search/SearchIcon";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "node_modules/react-redux/es";

interface CategoriesBarProps {
  forMobile: boolean;
  categories: any[];
}
function CategoriesBar({ forMobile, categories }: CategoriesBarProps) {
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const [active, setActive] = useState(searchParams.mainCategory ?? false);
  const searchEnabled = useSelector(
    (state: StateInterface) => state.Search.enable
  );
  const dispatch = useDispatch();
  const setSearchEnabled = (e) => {
    dispatch({ type: "ENABLE-SEARCH", payload: e });
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
            style={{ marginLeft: searchEnabled ? "13px" : "50px" }}
          >
            {!searchEnabled &&
              categories?.map((category, key) => (
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
