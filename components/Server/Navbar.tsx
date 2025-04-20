import MobileNavigation from "components/Home/MobileNavigation";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import { Suspense } from "react";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  try {
    const [categories, response] = await getMainCategories({
      lang: lang.split("-")[1],
      country: lang.split("-")[0],
    });

    return <MobileNavigation categories={categories} />;
  } catch (error) {
    console.error("Error loading navbar:", error);
    return <MobileNavigationSkeleton />;
  }
}

export default NavbarServer;
