import Home from "components/Home";
// import BrandsBar from "components/Home/Bars/BrandsBar";
// import CategoryBar from "components/Home/Bars/CategoryBar";
// import OfferBar from "components/Home/Bars/OfferBar";
// import QuickOffer from "components/Home/Bars/QuickOffer";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

interface Props {
  params: {
    lang: string;
    mainCategory: string;
  };
}
function page({ params }: Props) {
  return (
    <>
      <NavbarServer lang={params.lang} />

      <Home />

      <OfferListServer params={params} />
    </>
  );
}

export default page;
