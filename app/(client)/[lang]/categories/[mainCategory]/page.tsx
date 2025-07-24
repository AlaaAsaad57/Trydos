export const runtime = "nodejs";
export const preferredRegion = "bom1";
import Home from "components/Home";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";
import { HomePageProps } from "models/componentType/HomePagePropsType";
import { GetHomeData } from "utils/pagesDataRequests/HomePageData";
import FeatureProducts from "components/Server/FeatureProducts";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import FlashDealsProducts from "components/Server/FlashDealsProducts";

export async function generateMetadata({ params }) {
  try {
    const metadata = {
      title: `Categories - TryDos`,
      description:
        "Browse product categories on TryDos - Find exactly what you're looking for.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/categories/${params.mainCategory}`,
      },
    };
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: `Categories - TryDos`,
      description:
        "Browse product categories on TryDos - Find exactly what you're looking for.",
    };
  }
}

async function page({ params }: HomePageProps) {
  // Server component to render JSON-LD structured data

  const {
    boutiqueData,
    categoriesData,
    currencyData,
    featuredData,
    flashDealsData,
  } = await GetHomeData(params);
  return (
    <>
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

export default page;
