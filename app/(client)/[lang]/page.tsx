import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import NavbarSkeleton from "components/skeleton/navbar";
import OfferListSkeleton from "components/skeleton/OfferList";
import { Suspense } from "react";
function page({ params }) {
  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={false} />}>
        <NavbarServer lang={params.lang} />
      </Suspense>
      <Home />
      <BrandsBar />
      <Suspense fallback={<OfferListSkeleton />}>
        <OfferListServer params={params} />
      </Suspense>
    </>
  );
}

export default page;
