import MobileNavigation from "components/Home/MobileNavigation";
import Navbar from "components/Home/Navbar";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import { Suspense } from "react";
import { getMainCategories } from "store/homepage/cachedActions";

async function NavbarServer({ lang }: { lang: string }) {
  try {
    const [categories, response] = await getMainCategories({
      lang: lang.split("-")[1],
    });

    return (
      <Suspense fallback={<MobileNavigationSkeleton />}>
        <MobileNavigation categories={categories} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading navbar:", error);
    return <MobileNavigationSkeleton />;
  }
}

export default NavbarServer;
