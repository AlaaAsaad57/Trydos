import { getCachedCategories } from "serverRequests/cached/home";
import NavbarServer from "../Navbar";
import CategoryNavMobile from "components/Home/CategoryNavMobile";

export default async function MainCategoriesNavbar({
  lang,
  mainCategory,
}) {
  const [country, language] = lang?.split("-");
  let mainCategories = await getCachedCategories(country, language);
  let activeCategory = mainCategory;

  if (mainCategory) {
    // The active tab moves to the front. `find` returns undefined when the slug
    // is not in the list, and spreading that put `undefined` at the head, so
    // `category.name` below threw. An unknown slug used to be impossible here;
    // Amendment 2 lets any slug-shaped value render, so this is now reachable.
    const active = mainCategories.find((cat) => cat.slug === mainCategory);
    mainCategories = [
      ...(active ? [active] : []),
      ...mainCategories.filter((cat) => cat.slug !== mainCategory),
    ];
  }
  return (
    <>
      <NavbarServer
        lang={lang}
        mainCategory={mainCategory}
        categoriesData={mainCategories}
      >
        {mainCategories?.map((category, key) => (
          <div className="flex" key={key}>
            <CategoryNavMobile
              params={{ lang }}
              mainCategory={mainCategory}
              name={category.name}
              active={
                activeCategory === category.slug ||
                (mainCategory === category.slug &&
                  activeCategory === category?.slug)
              }
              key={key}
              myKey={key}
              icon={category?.flat_photo_path?.file_path}
              outline={category?.outline_photo_path?.file_path}
              slug={category.slug}
            />
          </div>
        ))}
      </NavbarServer>
    </>
  );
}
