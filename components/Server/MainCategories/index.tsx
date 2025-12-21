import NavbarServer from "../Navbar";
import CategoryNavMobile from "components/Home/CategoryNavMobile";
import { api } from "lib/eden";

export default async function MainCategoriesNavbar({
  lang,
  mainCategory,
}): Promise<JSX.Element> {
  const [country, language] = lang?.split("-");
  let responseData = await api.home.mainCategories.get({
    headers: { country: country, language: language },
    fetch: {
      next: {
        revalidate: 60,
      },
    },
  });

  let activeCategory = mainCategory;

  // @ts-ignore
  let mainCategories = responseData.data.data.mainCategories || [];
  if (mainCategory) {
    mainCategories = [
      mainCategories.find((cat) => cat.slug === mainCategory),
      ...mainCategories.filter((cat) => cat.slug !== mainCategory),
    ];
  }
  return (
    <NavbarServer
      lang={lang}
      mainCategory={mainCategory}
      categoriesData={mainCategories}
    >
      {mainCategories?.map((category, key) => (
        <div className="flex" key={key}>
          <CategoryNavMobile
            params={{ lang, mainCategory }}
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
  );
}
