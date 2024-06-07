import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
function page({ params }) {
  return (
    <>
      <NavbarServer lang={params.lang} />
      <Home />
      <BrandsBar />
      <OfferListServer params={params} />
    </>
  );
}

export default page;
