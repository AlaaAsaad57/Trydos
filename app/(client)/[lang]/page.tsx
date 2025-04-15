import Home from "components/Home";
// import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";

import { Suspense } from "react";
import "regenerator-runtime/runtime";
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamicParams = true;
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/countries`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch countries");
    }
    const data = await response.json();
    const languages = ["en", "ar", "tr"];

    return data.data.countries?.flatMap((country) =>
      languages.map((lang) => ({
        lang: `${country.iso.toLowerCase()}-${lang}`,
      }))
    );
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

function HomePage({ params }: { params: { lang: string } }) {
  return (
    <>
      <Suspense fallback={<MobileNavigationSkeleton />}>
        <NavbarServer lang={params.lang} />
      </Suspense>
      <Suspense fallback={<StoriesSkeleton />}>
        <StoriesBarServer />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <Home />
      </Suspense>
      <Suspense fallback={<OfferListSkeleton />}>
        <OfferListServer params={params} />
      </Suspense>
    </>
  );
}

export default HomePage;
