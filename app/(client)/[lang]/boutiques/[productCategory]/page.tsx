import FilterBar from "components/ListingPage/FilterBar";
import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import ListingSkeleton from "components/skeleton/listing";
import NavbarSkeleton from "components/skeleton/navbar";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBoutiqueMeta, getBoutiqueFilters } from "utils/functions";

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
async function Page({ params, searchParams }) {
  const boutiqueId = params.productCategory;

  const boutique = await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  const filters = await getBoutiqueFilters({ boutiqueId, lang: params.lang });
  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
        <CustomNavbarServer lang={params.lang} />
      </Suspense>
      <FilterBar filters={filters} boutique={boutique} />
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListServer params={params} />
      </Suspense>
    </>
  );
}

export default Page;
