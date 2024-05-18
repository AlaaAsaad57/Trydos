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
  return (
    <>
      {name === "Search" ? (
        <>
          <div
            className="categories-bar-item search-container"
            onClick={() => clickItem()}
            style={{ width: !searchEnabled ? "50px" : "auto" }}
            key={myKey}
          >
            {!searchEnabled && (
              <div className="categories-bar-item-icon">{icon}</div>
            )}
            {!searchEnabled && (
              <div className="categories-bar-item-description">
                <div
                  className={`categories-bar-item-name ${
                    language + "-regular"
                  }`}
                >
                  {translate(name, language)}
                </div>
                <NavIcon />
              </div>
            )}
            {name === "Search" && searchEnabled && (
              <SearchComponent
                close={() => close()}
                searchEnabled={searchEnabled}
              />
            )}
          </div>
        </>
      ) : (
        <>
          {!searchEnabled && (
            <div
              className="categories-bar-item ${}"
              onClick={() => clickItem()}
              key={myKey}
            >
              {!searchEnabled && (
                <div className="categories-bar-item-icon">{icon}</div>
              )}
              {!searchEnabled && (
                <div className="categories-bar-item-description">
                  <div
                    className={`categories-bar-item-name ${
                      language + "-regular"
                    }`}
                  >
                    {translate(name, language)}
                  </div>
                  <NavIcon />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CategoryNavItem;
