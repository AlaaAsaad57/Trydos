import Home from "components/Home";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
interface Props {
  params: {
    lang: string;
    mainCategory: string;
  };
}
function page({ params }: Props) {
  return (
    <>
      <Suspense fallback={<MobileNavigationSkeleton />}>
        <NavbarServer lang={params.lang} mainCategory={params?.mainCategory} />
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

export default page;
