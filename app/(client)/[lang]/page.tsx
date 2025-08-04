export const runtime = "nodejs";
export const preferredRegion = "bom1";

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
import {
  fetchBoutiques,
  fetchCurrency,
  fetchFilteredProducts,
} from "Server Requests";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

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
  return (
    <>
      <Suspense fallback={null}>
        <StructuredDataScript params={params} />
      </Suspense>

      <Suspense
        fallback={<MobileNavigationSkeleton />}
        key={`Navbar ${params.lang}`}
      >
        <MainCategoriesNavbar
          lang={params.lang}
          mainCategory={params.mainCategory}
        />
      </Suspense>

      <Suspense fallback={<StoriesSkeleton />} key={`Stories ${params.lang}`}>
        <StoriesBarServer
          language={params.lang.split("-")[1]}
          country={params.lang.split("-")[0]}
        />
      </Suspense>

      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FeaturedProductWrapper lang={params.lang} />
      </Suspense>
      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <FlashProductWrapper lang={params.lang} />
      </Suspense>
      <Home key={`Home ${params.lang}`} />
      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${params.lang}`}
      >
        <BoutiquesListWrapper params={params} />
      </Suspense>
    </>
  );
}

export default HomePage;
// Main Categories Bar
async function MainCategoriesNavbar({ lang, mainCategory }) {
  const [country, language] = lang?.split("-");
  // let mainCategories = await fetchMainCategories(language, country);
  let Reader = new ElasticsearchReader();
  let start = process.hrtime.bigint();
  let a = await Reader.getCategories({ country: country, size: 4000 });
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
    <NavbarServer
      lang={lang}
      time={Number(end - start) / 1_000_000}
      mainCategory={mainCategory}
      categoriesData={mainCategories}
    />
  );
}
// Featured Products
async function FeaturedProductWrapper({ lang }) {
  const [country, language] = lang?.split("-");
  let [data, currencyData] = await Promise.all([
    fetchFilteredProducts(
      language,
      country,
      [],
      "false",
      "true",
      null,
      null,
      true,
      false
    ),
    fetchCurrency(language, country),
  ]);
  return (
    <FeatureProducts
      currencyData={currencyData?.data?.currency}
      fetauredProductsData={data}
      lang={lang}
    />
  );
}
// FlasDeals Products
async function FlashProductWrapper({ lang }) {
  const [country, language] = lang?.split("-");
  let [data, currencyData] = await Promise.all([
    fetchFilteredProducts(
      language,
      country,
      [],
      "false",
      "true",
      null,
      null,
      false,
      true
    ),
    fetchCurrency(language, country),
  ]);
  return (
    <FlashDealsProducts
      currencyData={currencyData?.data?.currency}
      flashDealsProducts={data}
      lang={lang}
    />
  );
}

async function BoutiquesListWrapper({ params }) {
  const [country, language] = params.lang.split("-");
  let boutiqueData = await fetchBoutiques(
    language,
    country,
    params.mainCategory || "",
    null,
    10
  );
  // let Reader = new ElasticsearchReader();
  // // let a = await Reader.getBoutiques({ country: country, size: 40 });
  // // // @ts-ignore
  // // console.log(a.hits.hits[0]._source.custom_boutiques[0]);
  return <OfferListServer boutiquesData={boutiqueData} params={params} />;
}
