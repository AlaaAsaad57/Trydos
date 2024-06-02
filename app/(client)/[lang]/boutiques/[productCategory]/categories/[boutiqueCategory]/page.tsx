import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getListingData } from "store/homepage/cachedActions";
import ProductsList from "components/ListingPage/ProductsList";
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
      <ProductsList Listing_Data_res={Listing_Data_res} />
    </>
  );
}

export default page;
