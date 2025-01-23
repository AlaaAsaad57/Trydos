import Home from "components/Home";
// import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "nodejs";
async function HomePage({ params }) {
  return (
    <>
      <NavbarServer lang={params.lang} />

      <Home />
      {/* <BrandsBar /> */}

      <OfferListServer params={params} />
    </>
  );
}

export default HomePage;
