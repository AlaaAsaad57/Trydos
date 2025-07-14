export const runtime = "nodejs";
export const preferredRegion = process.env.PREFERRED_REGION || "bom1";
export const revalidate = parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE);
export const dynamicParams = true;
export const dynamic = "auto";

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
import { getHomeMetadata, GetStructuredData } from "./MetaData";

import { HomePageProps } from "models/componentType/HomePagePropsType";
import { GetHomeData } from "utils/pagesDataRequests/HomePageData";

export async function generateMetadata({ params }) {
  try {
    const metadata = await getHomeMetadata({ params });

    // console.log("**********metadata***********", JSON.stringify(metadata));
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
async function StructuredDataScript({ params }) {
  try {
    const structuredData = await GetStructuredData({ params });
    // console.log(
    //   "**********structuredData***********",
    //   JSON.stringify(structuredData)
    // );

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

async function HomePage({ params }: HomePageProps) {
  const {
    boutiqueData,
    categoriesData,
    currencyData,
    featuredData,
    flashDealsData,
  } = await GetHomeData(params);
  return (
    <>
      <Suspense fallback={null}>
        <StructuredDataScript params={params} />
      </Suspense>

      <Suspense
        fallback={<MobileNavigationSkeleton />}
        key={`Navbar ${params.lang}`}
      >
        <NavbarServer
          lang={params.lang}
          mainCategory={params?.mainCategory}
          categoriesData={categoriesData}
        />
      </Suspense>

      <Suspense fallback={<StoriesSkeleton />} key={`Stories ${params.lang}`}>
        <StoriesBarServer
          language={params.lang.split("-")[1]}
          country={params.lang.split("-")[0]}
        />
      </Suspense>

      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FeatureProducts
          currencyData={currencyData}
          fetauredProductsData={featuredData}
          lang={params.lang}
        />
      </Suspense>
      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FlashDealsProducts
          currencyData={currencyData}
          flashDealsProducts={flashDealsData}
          lang={params.lang}
        />
      </Suspense>
      <Suspense fallback={<></>} key={`Home ${params.lang}`}>
        <Home />
      </Suspense>
      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${params.lang}`}
      >
        <OfferListServer boutiquesData={boutiqueData} params={params} />
      </Suspense>
    </>
  );
}

export default HomePage;
