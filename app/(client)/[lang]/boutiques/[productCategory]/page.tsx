import FilterBar from "components/ListingPage/FilterBar";
import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import ListingSkeleton from "components/skeleton/listing";
import NavbarSkeleton from "components/skeleton/navbar";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBoutiqueMeta } from "utils/functions";

export async function generateMetadata({ params, searchParams }) {
  const boutiqueId = params.productCategory;
  const metaData =
    boutiqueId === "listing"
      ? { name: "listing" }
      : await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  if (!metaData?.name) {
    notFound();
  }
  if (boutiqueId === "listing") {
    return {
      title: `Trydos - ${searchParams.search_text} `,
      description: ``,
    };
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

export default Page;
