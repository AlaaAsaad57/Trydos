import { Sendevent, translate } from "utils/functions";
import { useSelector } from "react-redux";

const SearchComponent = dynamic(() => import("./SearchComponent"), {
  ssr: false,
});
import dynamic from "next/dynamic";
import RemoteSvg from "components/global/RemoteSvg";
import { useParams, useRouter } from "next/navigation";
import { dispatchRouteChangeEvent } from "Hooks/events";

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
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const language = useSelector((state: any) => state.homepage.language);
  const router = useRouter();
  const clickItem = () => {
    if (name === "Search") {
      openSearch();
    } else {
      Sendevent({
        event: "button_clicked",
        category: "button_clicked",
        value: `${name} category filter`,
      });
      router.push(`/categories/${slug}`);
      dispatchRouteChangeEvent("start");
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
                <img src="/svg/navIcon.svg" />
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
                decodeURI(searchParams.mainCategory) === slug &&
                "active-nav-category"
              }`}
              onClick={() => clickItem()}
              key={myKey}
            >
              {!searchEnabled && (
                <div className="categories-bar-item-icon ">
                  <RemoteSvg size={20} url={icon} isSvg={null} />
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
                  <img src="/svg/navIcon.svg" />
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
