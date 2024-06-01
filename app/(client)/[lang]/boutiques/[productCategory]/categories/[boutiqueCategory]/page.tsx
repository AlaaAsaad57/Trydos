import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getListingData } from "store/homepage/cachedActions";
const ProductCard = dynamic(() => import("components/ListingPage/ProductCard"));
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
      <Suspense>
        <ProductCard Listing_Data_res={Listing_Data_res} />
      </Suspense>
    </>
  );
}

export default page;
