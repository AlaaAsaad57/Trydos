import { Sendevent, translateFunction } from "utils/functions";

import { useParams } from "next/navigation";

import Image from "next/image";
import NextLink from "components/global/NextLink";
import { useAppStore } from "store";

interface CategoryNavItemProps {
  name: string;
  icon: string;
  searchEnabled: boolean;
  close: Function;
  openSearch: Function;
  myKey: number;
  slug: string;
  active: boolean;
  setActive: Function;
}
const CategoryNavItem = ({
  name,
  icon,
  searchEnabled,
  close,
  slug,
  openSearch,
  myKey,
  setActive,
  active,
}: CategoryNavItemProps) => {
  const { language } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const searchParams: { lang: string; mainCategory: string } = useParams();
  const clickItem = () => {
    if (name === "Search") {
      openSearch();
    } else {
      setActive(slug);
      Sendevent({
        event: "button_clicked",
        value: `choose_category_button`,
        extra: {
          category: slug,
        },
      });
      // router.push(`/categories/${slug}`);
      // dispatchRouteChangeEvent("start", { from: "", to: "categoriesPage" });
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
                <img alt="nav icon" src="/svg/navIcon.svg" />
              </div>
            )}
            {/* {name === "Search" && searchEnabled && (
              <SearchComponent
                close={() => close()}
                searchEnabled={searchEnabled}

              />
            )} */}
          </div>
        </>
      ) : (
        <>
          {!searchEnabled && (
            <NextLink
              ariaLabel={`Category ${slug} ${lang}`}
              href={
                decodeURI(searchParams.mainCategory) === slug
                  ? `/${lang}`
                  : `/${lang}/categories/${slug}`
              }
              className={`categories-bar-item ${
                (decodeURI(searchParams.mainCategory) === slug || active) &&
                "active-nav-category"
              }`}
              onClick={() => clickItem()}
              key={myKey}
            >
              {/* {decodeURI(searchParams.mainCategory) === slug && (
                <ActiveCategoryIcon className="absolute top-[-7px] left-[-13px]" />
              )} */}
              {!searchEnabled && (
                <div className="categories-bar-item-icon ">
                  <Image
                    unoptimized
                    width={20}
                    height={20}
                    alt={name}
                    src={icon?.replace("/upload", "/upload/h_50/f_webp/q_auto")}
                  />
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
                  <img alt="nav icon" src="/svg/navIcon.svg" />
                </div>
              )}
            </NextLink>
          )}
        </>
      )}
    </>
  );
};

export default CategoryNavItem;
