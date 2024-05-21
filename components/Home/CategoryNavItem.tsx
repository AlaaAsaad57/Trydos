import { translate } from "utils/functions";
import { useSelector } from "react-redux";
import NavIcon from "public/svg/navIcon.svg";
const SearchComponent = dynamic(() => import("./SearchComponent"), {
  ssr: false,
});
import dynamic from "next/dynamic";
import RemoteSvg from "components/global/RemoteSvg";
import { useRouter, useSearchParams } from "next/navigation";
import homeService from "services/home";
interface CategoryNavItemProps {
  name: string;
  icon: string;
  searchEnabled: boolean;
  close: Function;
  openSearch: Function;
  myKey: number;
  slug: string;
}
const CategoryNavItem = ({
  name,
  icon,
  searchEnabled,
  close,
  slug,
  openSearch,
  myKey,
}: CategoryNavItemProps) => {
  const searchParams = useSearchParams();
  const language = useSelector((state: any) => state.homepage.language);
  const router = useRouter();
  const clickItem = () => {
    if (name === "Search") {
      openSearch();
    } else {
      router.push(`/categories/${slug}`);
      homeService.GetBoutiques(slug);
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
              className={`categories-bar-item ${
                decodeURI(searchParams.get("category_slug")) === slug &&
                "active-nav-category"
              }`}
              onClick={() => clickItem()}
              key={myKey}
            >
              {!searchEnabled && (
                <div className="categories-bar-item-icon  h-[15px]">
                  <RemoteSvg url={icon} />
                </div>
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
