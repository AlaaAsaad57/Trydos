import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";

// import ListingSkeleton from "components/skeleton/listing";
// import NavbarSkeleton from "components/skeleton/navbar";
import { notFound } from "next/navigation";
// import { Suspense } from "react";
import { getBoutiqueMeta } from "utils/functions";

interface Props {
  params: {
    lang: string;
    productCategory: string;
  };
  searchParams: {
    categories: string;
    prices: string;
    search_text: string;
    brands: string;
    colors: string;
  };
}

export async function generateMetadata({ params, searchParams }: Props) {
  const boutiqueId = params.productCategory;
  try {
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
    } else
      return {
        title: `Trydos - ${metaData?.name} `,
        // @ts-ignore
        description: `${metaData?.name} - ${metaData?.description} `,
      };
  } catch (error) {
    notFound();
  }
}

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

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
