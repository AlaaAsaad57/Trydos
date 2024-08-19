import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import CategoryBar from "components/Home/Bars/CategoryBar";
import OfferBar from "components/Home/Bars/OfferBar";
import QuickOffer from "components/Home/Bars/QuickOffer";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";

export const revalidate = 3600;
async function page({ params }) {
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
