import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import NavbarSkeleton from "components/skeleton/navbar";
import OfferListSkeleton from "components/skeleton/OfferList";
import { Suspense } from "react";
function HomePage({ params }) {
  return (
    <>
      <NavbarServer lang={params.lang} />

      <Home />
      <BrandsBar />

      <OfferListServer params={params} />
    </>
  );
}

export default HomePage;
