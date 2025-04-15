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

function HomePage({ params }) {
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
