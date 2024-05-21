import Navbar from "components/Home/Navbar";
import React from "react";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  const [categories] = await getMainCategories({ lang: lang.split("-")[1] });

  return <Navbar init={lang} categories={categories} />;
}

export default NavbarServer;
