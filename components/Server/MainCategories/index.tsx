import SearchIcon from "components/Home/Search/SearchIcon";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import NavbarServer from "../Navbar";

export default async function MainCategoriesNavbar({ lang, mainCategory }) {
  const [country, language] = lang?.split("-");

  let Reader = new ElasticsearchReader();
  let start = process.hrtime.bigint();
  let a = await Reader.getCategories({ country: country, size: 4000 });
  // @ts-ignore

  let mainCategories = a.hits.hits.map((s) => {
    // @ts-ignore
    return s._source?.custom_categories?.find(
      (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase()
    );
  });
  mainCategories = mainCategories.filter((c) => c !== undefined);
  mainCategories = Array.from(
    new Map(mainCategories.map((c: any) => [c.id, c])).values()
  );
  let end = process.hrtime.bigint();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
      }  bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]`}
    >
      <SearchIcon time={Number(end - start) / 1_000_000} />
      <NavbarServer
        lang={lang}
        time={Number(end - start) / 1_000_000}
        mainCategory={mainCategory}
        categoriesData={mainCategories}
      />
    </div>
  );
}
