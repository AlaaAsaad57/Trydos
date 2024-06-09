"use server";
import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import CategoryBar from "components/Home/Bars/CategoryBar";
import OfferBar from "components/Home/Bars/OfferBar";
import QuickOffer from "components/Home/Bars/QuickOffer";
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
      <CategoryBar />
      <OfferBar />
      <QuickOffer />
    </>
  );
}

export default page;
