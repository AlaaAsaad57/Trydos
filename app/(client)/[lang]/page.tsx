import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import OfferListServer from "components/Server/OfferListServer";
function page({ params }) {
  return (
    <>
      <Home />
      <BrandsBar />
      <OfferListServer params={params} searchParams={params.categories} />
    </>
  );
}

export default page;
