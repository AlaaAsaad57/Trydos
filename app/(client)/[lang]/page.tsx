import Home from "components/Home";
import BrandsBar from "components/Home/Bars/BrandsBar";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
export const revalidate = 360000;
export const dynamicParams = true;
export const generateStaticParams = async () => {
  return [
    { lang: "tr-en" },
    { lang: "tr-ar" },
    { lang: "lb-en" },
    { lang: "lb-ar" },
  ];
};

async function HomePage({ params }) {
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
