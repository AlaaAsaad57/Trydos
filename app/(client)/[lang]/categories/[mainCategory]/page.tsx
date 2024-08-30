import Home from "components/Home";
// import BrandsBar from "components/Home/Bars/BrandsBar";
// import CategoryBar from "components/Home/Bars/CategoryBar";
// import OfferBar from "components/Home/Bars/OfferBar";
// import QuickOffer from "components/Home/Bars/QuickOffer";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import { getMainCategoriesStatic } from "store/homepage/cachedActions";

export const revalidate = 36000;
export const dynamicParams = true;
export const generateStaticParams = async () => {
  let [categories] = await getMainCategoriesStatic();

  let arr = [
    { lang: "tr-en" },
    { lang: "tr-ar" },
    { lang: "lb-en" },
    { lang: "lb-ar" },
  ].map((l) => {
    return categories.map((s) => {
      return { slug: s.slug, lang: l.lang };
    });
  });

  return arr.flat().map((s) => ({
    mainCategory: s.slug,
    lang: s.lang,
  }));
};
async function page({ params }) {
  return (
    <>
      <NavbarServer lang={params.lang} />

      <Home />

      <OfferListServer params={params} />
    </>
  );
}

export default page;
