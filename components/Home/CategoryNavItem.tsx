import { translate } from "utils/functions";
import { useSelector } from "react-redux";
import NavIcon from "public/svg/navIcon.svg";
const SearchComponent = dynamic(() => import("./SearchComponent"), {
  ssr: false,
});
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReactElement } from "react";
interface CategoryNavItemProps {
  name: string;
  icon: ReactElement;
  searchEnabled: boolean;
  close: Function;
  openSearch: Function;
  myKey: number;
}
const CategoryNavItem = ({
  name,
  icon,
  searchEnabled,
  close,
  openSearch,
  myKey,
}: CategoryNavItemProps) => {
  const language = useSelector((state: any) => state.homepage.language);
  const clickItem = () => {
    if (name === "Search") {
      openSearch();
    } else {
    }
  };
  return (!searchEnabled || name === "Search") && name !== "Search" ? (
    <Link
      prefetch={false}
      href={`/${name}`}
      aria-label={`Go To ${name} Category Page`}
    >
      <div
        className="categories-bar-item"
        onClick={() => clickItem()}
        key={myKey}
      >
        {!searchEnabled && (
          <div className="categories-bar-item-icon">{icon}</div>
        )}
        {!searchEnabled && (
          <div className="categories-bar-item-description">
            <div
              className={`categories-bar-item-name ${language + "-regular"}`}
            >
              {translate(name, language)}
            </div>
            <NavIcon />
          </div>
        )}
        {name === "Search" && (
          <SearchComponent
            close={() => close()}
            searchEnabled={searchEnabled}
          />
        )}
      </div>
    </Link>
  ) : (
    <div
      className={`categories-bar-item  ${searchEnabled && "active-search"}`}
      onClick={() => clickItem()}
      key={myKey}
    >
      {!searchEnabled && <div className="categories-bar-item-icon">{icon}</div>}
      {!searchEnabled && (
        <div className="categories-bar-item-description">
          <div className={`categories-bar-item-name ${language + "-regular"}`}>
            {translate(name, language)}
          </div>
          <NavIcon />
        </div>
      )}
      {name === "Search" && (
        <SearchComponent close={() => close()} searchEnabled={searchEnabled} />
      )}
    </div>
  );
};

export default CategoryNavItem;
