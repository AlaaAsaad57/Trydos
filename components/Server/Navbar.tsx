import Navbar from "components/Home/Navbar";
import { Suspense } from "react";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  const [categories] = await getMainCategories({ lang: lang.split("-")[1] });

  return (
    <Suspense>
      <Navbar init={lang} categories={categories} />
    </Suspense>
  );
}

export default NavbarServer;
