import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";

import ListingSkeleton from "components/skeleton/listing";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBoutiques, getHomeData } from "store/homepage/cachedActions";
import { getBoutiqueMeta } from "utils/functions";
export const dynamicParams = true;

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
        title: `Trydos - ${searchParams.searchText || "Search"} `,
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

export async function generateStaticParams({ params }) {
  // Fetch your main product categories
  try {
    const boutiques_slugs = await getBoutiques({
      lang: params.lang ? params.lang.split("-")[1] : null,
      country: params.lang ? params.lang.split("-")[0] : null,
      str: "",
    });

    return boutiques_slugs.map((category) => ({
      productCategory: category,
      lang: params.lang,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}
interface Props {
  params: {
    lang: string;
    productCategory: string;
  };
  searchParams: {
    categories: string;
    prices: string;
    searchText: string;
    brands: string;
    colors: string;
  };
}
interface ParamsType {
  lang: string;
  productCategory: string;
}
export default function Page({
  params,
  searchParams,
}: {
  params: ParamsType;
  searchParams: any;
}) {
  return (
    <>
      <Suspense fallback={<ListingSkeleton forProducts={false} />}>
        <FilterList params={params} searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ListingSkeleton forProducts={true} />}>
        <ProductListServer searchParams={searchParams} params={params} />
      </Suspense>
    </>
  );
}
