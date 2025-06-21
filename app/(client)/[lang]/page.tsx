import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";

import { Suspense } from "react";

import Home from "components/Home";
import FeatureProducts from "components/Server/FeatureProducts";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import { HomePageProps } from "models/componentType/HomePagePropsType";
export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE);
export const dynamicParams = true;
export const dynamic = "auto";

function HomePage({
  params,
}: HomePageProps) {
  return (
    <>
      <Suspense
        fallback={<MobileNavigationSkeleton />}
        key={`Navbar ${params.lang}`}
      >
        <NavbarServer lang={params.lang} mainCategory={params?.mainCategory} />
      </Suspense>

      <Suspense fallback={<StoriesSkeleton />} key={`Stories ${params.lang}`}>
        <StoriesBarServer />
      </Suspense>

      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FeatureProducts lang={params.lang} />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            Loading...
          </div>
        }
        key={`Home ${params.lang}`}
      >
        <Home />
      </Suspense>
      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${params.lang}`}
      >
        <OfferListServer params={params} />
      </Suspense>
    </>
  );
}

export default HomePage;
