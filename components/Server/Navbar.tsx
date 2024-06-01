import Navbar from "components/Home/Navbar";
import { Suspense } from "react";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  const [categories] = await getMainCategories({ lang: lang.split("-")[1] });
  console.log("render nav");
  return (
    <Suspense fallback={<p>loading</p>}>
      <Navbar init={lang} categories={categories} />
    </Suspense>
  );
}

export default NavbarServer;
