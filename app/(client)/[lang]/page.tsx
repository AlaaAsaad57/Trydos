"use server";
import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import CategoryBar from "components/Home/Bars/CategoryBar";
import OfferBar from "components/Home/Bars/OfferBar";
import QuickOffer from "components/Home/Bars/QuickOffer";
import OfferListServer from "components/Server/OfferListServer";
async function page({ params }): Promise<any> {
  return (
    <>
      <Home />
      <BrandsBar />
      <OfferListServer params={params} searchParams={params.categories} />
    </>
  );
}

export default page;
