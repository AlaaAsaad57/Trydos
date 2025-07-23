import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import SearchIcon from "../Home/Search/SearchIcon";
import CategoryNavMobile from "components/Home/CategoryNavMobile";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

import { fetchMainCategories } from "Server Requests";
import { NavbarServerProps } from "models/componentType/HomePagePropsType";

async function NavbarServer({
  lang,
  mainCategory,
  categoriesData,
}: NavbarServerProps) {
  try {
    console.log(categoriesData);
    const { mainCategories: categories } = categoriesData;

    categories.sort((a, b) => (a.slug === mainCategory ? -1 : 1));

    return (
      <div className="flex-row search-nav-holder">
        <SearchIcon />

        <HortiznalScrollBar
          id="categories-bar-container"
          className={`categories-bar-container mobile-bar `}
          dataCy="categoryNavBar"
        >
          {typeof categories !== "string" &&
            categories?.map((category, key) => (
              <CategoryNavMobile
                params={{ lang, mainCategory }}
                name={category.name}
                active={mainCategory === category.slug}
                key={key}
                myKey={key}
                icon={category?.flat_photo_path?.file_path}
                slug={category.slug}
              />
            ))}
        </HortiznalScrollBar>
      </div>
    );
  } catch (error) {
    console.error("Error loading navbar:", error);
    return <MobileNavigationSkeleton />;
  }
}

export default NavbarServer;
