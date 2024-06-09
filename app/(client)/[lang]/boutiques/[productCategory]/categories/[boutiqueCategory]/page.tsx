import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
import ListingSkeleton from "components/skeleton/listing";
import ProductListServer from "components/Server/ProductList";
import NavbarSkeleton from "components/skeleton/navbar";
export async function generateMetadata({ params }) {
  const categories = params.productCategory;
  return {
    title: `Trydos - ${categories} `,
    description: `Trydos ${categories} Page`,
  };
}
async function page({ params }) {
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

export default page;
