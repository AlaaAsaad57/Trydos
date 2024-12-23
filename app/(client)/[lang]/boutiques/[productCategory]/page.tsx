import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { getHomeDataStatic } from "store/homepage/cachedActions";

// import ListingSkeleton from "components/skeleton/listing";
// import NavbarSkeleton from "components/skeleton/navbar";
import { notFound } from "next/navigation";
// import { Suspense } from "react";
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
    description: `${metaData?.name} - ${metaData?.description} `,
  };
}

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "edge";
interface ParamsType {
  lang: string;
  productCategory: string;
}
async function Page({
  params,
  searchParams,
}: {
  params: ParamsType;
  searchParams: any;
}) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />

      <ProductListServer searchParams={searchParams} params={params} />
    </>
  );
}

export default Page;
