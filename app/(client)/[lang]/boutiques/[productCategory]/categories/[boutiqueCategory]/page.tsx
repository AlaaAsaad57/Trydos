import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
import ListingSkeleton from "components/skeleton/listing";
import ProductListServer from "components/Server/ProductList";
import NavbarSkeleton from "components/skeleton/navbar";
import FilterBar from "components/ListingPage/FilterBar";
import { getBoutiqueMeta, getBoutiqueFilters } from "utils/functions";
import { notFound } from "next/navigation";
export async function generateMetadata({ params }) {
  const boutiqueId = params.productCategory;
  const metaData = await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  if (!metaData?.name) {
    notFound();
  }
  return {
    title: `Trydos - ${metaData?.name} `,
    description: `${metaData?.description} `,
    openGraph: {
      title: metaData?.name,
      description: `${metaData?.description} `,
      url: process.env.NEXT_PUBLIC_BASE_SITE_URL + `boutiques/${boutiqueId}`,
      images: metaData?.photo,
    },
  };
}
async function page({ params, searchParams }) {
  const boutiqueId = params.productCategory;
  const boutique = await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  const filters = await getBoutiqueFilters({ boutiqueId, lang: params.lang });

  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
        <CustomNavbarServer lang={params.lang} />
      </Suspense>

      <Suspense fallback={<ListingSkeleton />}>
        <ProductListServer searchParams={searchParams} params={params} />
      </Suspense>
    </>
  );
}

export default page;
