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
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

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
  let [country, language] = params.lang.split("-");
  let category: string = params.mainCategory as string;
  const { currencyData, featuredData, flashDealsData } = await GetHomeData(
    params
  );
  let Reader = new ElasticsearchReader();
  let start = process.hrtime.bigint();

  let [a, data] = await Promise.all([
    Reader.getCategories({ country: country, size: 4000 }),
    Reader.getBoutiques({
      language,
      country,
      limit: 10,
      category: category as string,
    }),
  ]);
  // @ts-ignore

  let mainCategories = a.hits.hits.map((s) => {
    // @ts-ignore
    return s._source?.custom_categories?.find(
      (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase()
    );
  });
  mainCategories = Array.from(
    new Map(mainCategories.map((c: any) => [c.id, c])).values()
  );
  let end = process.hrtime.bigint();
  return (
    <>
      <Suspense
        fallback={<MobileNavigationSkeleton />}
        key={`Navbar ${params.lang}`}
      >
        <NavbarServer
          time={Number(end - start) / 1_000_000}
          lang={params.lang}
          mainCategory={params?.mainCategory}
          categoriesData={mainCategories}
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
        <OfferListServer boutiquesData={data} params={params} />
      </Suspense>
    </>
  );
}

export default page;
