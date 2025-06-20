import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";

import { Suspense } from "react";

import Home from "components/Home";
import FeatureProducts from "components/Server/FeatureProducts";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { getHomeMetadata } from "./MetaData";

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE);
export const dynamicParams = true;
export const dynamic = "auto";

export async function generateMetadata({ params, searchParams }) {
  try {
    const metadata = await getHomeMetadata({ params, searchParams });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
    };
  }
}

// Server component to render JSON-LD structured data
async function StructuredDataScript({ params, searchParams }) {
  try {
    const metadataWithStructuredData = await getHomeMetadata({
      params,
      searchParams,
    });
    const structuredData = metadataWithStructuredData.structuredData;

    if (!structuredData) return null;

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    );
  } catch (error) {
    console.error("Error generating structured data:", error);
    return null;
  }
}

function HomePage({
  params,
  searchParams,
}: {
  params: { lang: string; mainCategory?: string };
  searchParams?: any;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <StructuredDataScript params={params} searchParams={searchParams} />
      </Suspense>

      <Suspense
        fallback={<MobileNavigationSkeleton />}
        key={`Navbar ${params.lang}`}
      >
        <NavbarServer lang={params.lang} mainCategory={params?.mainCategory} />
      </Suspense>

      <Suspense fallback={<StoriesSkeleton />} key={`Stories ${params.lang}`}>
        <StoriesBarServer
          language={params.lang.split("-")[1]}
          country={params.lang.split("-")[0]}
        />
      </Suspense>

      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FeatureProducts lang={params.lang} />
      </Suspense>
      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FlashDealsProducts lang={params.lang} />
      </Suspense>
      <Suspense fallback={<></>} key={`Home ${params.lang}`}>
        <Home />
      </Suspense>
      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${params.lang}`}
      >
        <OfferListServer params={params} />
      </Suspense>
    </>
  );
}

export default HomePage;
