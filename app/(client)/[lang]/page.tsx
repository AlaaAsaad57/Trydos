export const runtime = "nodejs";
export const preferredRegion = "bom1";
export const dynamic = "force-dynamic";

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
import { fetchCurrency } from "Server Requests";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "Server Requests/radis";
import RecomendedProducts from "components/Server/RecomendedProducts";
import { translateFunction } from "utils/functions";
import SearchIcon from "components/Home/Search/SearchIcon";
import MainCategoriesNavbar from "components/Server/MainCategories";

export async function generateMetadata({ params }) {
  let language = params.lang?.split("-")[1];
  try {
    const metadata = await getHomeMetadata({ params });

    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: translateFunction(
        "TryDos - Premium Shopping Experience",
        language
      ),
      description: translateFunction(
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
        language
      ),
      verification: {
        google: process.env.GOOGLE_VERIFICATION,
      },
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
async function getCurrency(country, language) {
  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      return { ...JSON.parse(cachedCurrency), redis: true };
    }
    if (cachedCurrency?.exchange_rate) {
      return { ...cachedCurrency, redis: true };
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data.currency };

      StoreCurrency(country, currency);
      return { ...currency, redis: false };
    }
  } catch (error) {
    return {};
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

// Featured Products
async function FeaturedProductWrapper({ lang }) {
  const [country, language] = lang?.split("-");
  let start = process.hrtime.bigint();
  let [currencyData, data] = await Promise.all([
    getCurrency(country, language),
    getProductsAndFiltersFromElastic({
      country: country,
      language_code: language,
      filters: {
        featured: true,
      },
      limit: 10,
    }),
  ]);
  let end = process.hrtime.bigint();
  return (
    <FeatureProducts
      dataSourceString={`Feature Products Data Source: Products From Elastic, currency from ${
        currencyData?.redis ? "redis" : "laravel api"
      } in ${Number(end - start) / 1_000_000} ms`}
      currencyData={currencyData}
      fetauredProductsData={{ data: { products: data.products } }}
      lang={lang}
    />
  );
}
// FlasDeals Products
async function FlashProductWrapper({ lang }) {
  const [country, language] = lang?.split("-");
  let start = process.hrtime.bigint();

  let [currencyData, data] = await Promise.all([
    getCurrency(country, language),
    getProductsAndFiltersFromElastic({
      country: country,
      language_code: language,
      filters: {
        flashdeal: true,
      },
      limit: 10,
    }),
  ]);
  let end = process.hrtime.bigint();

  return (
    <FlashDealsProducts
      dataSourceString={`FlashDeals Products Data Source: Products From Elastic, currency from ${
        currencyData?.redis ? "redis" : "laravel api"
      } in ${Number(end - start) / 1_000_000} ms`}
      currencyData={currencyData}
      flashDealsProducts={{ data: { products: data.products } }}
      lang={lang}
    />
  );
}

async function BoutiquesListWrapper({ params }) {
  const [country, language] = params.lang.split("-");
  let start = process.hrtime.bigint();
  let Reader = new ElasticsearchReader();
  let data = await Reader.getBoutiques({
    language,
    country,
    limit: 10,
    category: params.mainCategory,
  });

  // @ts-ignore
  let end = process.hrtime.bigint();
  return (
    <OfferListServer
      dataSourceString={`Boutiques Data Source: Products From Elastic in ${
        Number(end - start) / 1_000_000
      } ms`}
      boutiquesData={{ ...data, temp: Number(end - start) / 1_000_000 }}
      params={params}
    >
      <Suspense fallback={<FeaturedProductsSkeleton lang={params.lang} />}>
        <RecomendedProductWrapper lang={params.lang} />
      </Suspense>
    </OfferListServer>
  );
}
async function RecomendedProductWrapper({ lang }) {
  const [country, language] = lang.split("-");
  let Reader = new ElasticsearchReader();

  let [currencyData, data, featured, flashdeals] = await Promise.all([
    getCurrency(country, language),
    Reader.getRecommendations({ language, country }),
    getProductsAndFiltersFromElastic({
      country: country,
      language_code: language,
      filters: {
        featured: true,
      },
      noFilters: true,
      limit: 10,
    }),
    getProductsAndFiltersFromElastic({
      country: country,
      language_code: language,
      filters: {
        flashdeal: true,
      },
      noFilters: true,
      limit: 10,
    }),
  ]);
  let unique_products = data.products.filter((product) => {
    if (
      featured?.products?.find(
        (f_product) => f_product?.product_id === product.product_id
      )
    )
      return false;
    if (
      flashdeals?.products?.find(
        (f_product) => f_product?.product_id === product.product_id
      )
    )
      return false;
    return true;
  });
  return (
    <RecomendedProducts
      products={{ data: { ...data, products: unique_products } }}
      lang={lang}
      currencyData={currencyData}
    />
  );
}
