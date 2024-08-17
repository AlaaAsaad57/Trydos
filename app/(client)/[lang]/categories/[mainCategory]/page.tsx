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
      <NavbarServer lang={params.lang} />

      <Home />
      <BrandsBar />

      <OfferListServer params={params} />

      <CategoryBar />
      <OfferBar />
      <QuickOffer />
    </>
  );
}

export default page;
