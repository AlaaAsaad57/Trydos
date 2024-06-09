import ProductsList from "components/ListingPage/ProductsList";
import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import ListingSkeleton from "components/skeleton/listing";
import NavbarSkeleton from "components/skeleton/navbar";
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
  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
        <CustomNavbarServer lang={params.lang} />
      </Suspense>

      <Suspense fallback={<ListingSkeleton />}>
        <ProductListServer params={params} />
      </Suspense>
    </>
  );
}

export default Page;
