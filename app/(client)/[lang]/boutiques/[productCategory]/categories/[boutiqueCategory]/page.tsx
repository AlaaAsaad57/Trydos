import { getListingData } from "store/homepage/cachedActions";
import ProductsList from "components/ListingPage/ProductsList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
export async function generateMetadata({ params }) {
  const categories = params.productCategory;
  return {
    title: `Trydos - ${categories} `,
    description: `Trydos ${categories} Page`,
  };
}
async function page({ params }) {
  const [, Listing_Data_res] = await getListingData({
    categories: params.productCategory,
    productCategory: params.boutiqueCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });

  return (
    <>
      <CustomNavbarServer lang={params.lang} />
      <ProductsList
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default page;
