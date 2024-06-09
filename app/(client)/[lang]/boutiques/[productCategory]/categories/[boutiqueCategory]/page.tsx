import { getListingData } from "store/homepage/cachedActions";
import ProductsList from "components/ListingPage/ProductsList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
import ListingSkeleton from "components/skeleton/listing";
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
      <Suspense fallback={<ListingSkeleton />}>
        <ProductsList
          Listing_Data_res={Listing_Data_res}
          productCategory={params.productCategory}
          boutiqueCategory={params.boutiqueCategory}
        />
      </Suspense>
    </>
  );
}

export default page;
