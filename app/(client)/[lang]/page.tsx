import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import OfferListServer from "components/Server/OfferListServer";
function HomePage({ params }) {
  return (
    <>
      <Home />
      <BrandsBar />
      <OfferListServer params={params} />
    </>
  );
}

export default HomePage;
