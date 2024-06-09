import ProductsList from "components/ListingPage/ProductsList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import ListingSkeleton from "components/skeleton/listing";
import { Suspense } from "react";
import { getListingData } from "store/homepage/cachedActions";
export async function generateMetadata({ params, searchParams }) {
  // read route params
  const categories = params.productCategory;
  return {
    title: `Trydos - ${categories}`,
    description: `Trydos ${categories} Page`,
  };
}
async function Page({ params, searchParams }) {
  const [, Listing_Data_res] = await getListingData({
    categories: params.productCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    productCategory: null,
  });
  return (
    <>
      <CustomNavbarServer lang={params.lang} />
      <Suspense fallback={<ListingSkeleton />}>
        <ProductsList
          Listing_Data_res={Listing_Data_res}
          productCategory={params.productCategory}
          boutiqueCategory={null}
        />
      </Suspense>
    </>
  );
}

export default Page;
