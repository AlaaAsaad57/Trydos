import Navbar from "components/Home/Navbar";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  const [categories, response] = await getMainCategories({
    lang: lang.split("-")[1],
  });

  return <Navbar response={response} init={lang} categories={categories} />;
}

export default NavbarServer;
