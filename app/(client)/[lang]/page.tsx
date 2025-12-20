export const dynamic = "force-dynamic";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";
import type { JSX } from "react";
import Home from "components/Home";
import FeatureProducts from "components/Server/FeatureProducts";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { getHomeMetadata, GetStructuredData } from "./MetaData";
import { fetchCurrency } from "serverRequests";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import RecomendedProducts from "components/Server/RecomendedProducts";
import { translateFunction } from "utils/functions";
import MainCategoriesNavbar from "components/Server/MainCategories";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import SearchIcon from "components/Home/Search/SearchIcon";
import { api } from "lib/eden";

export async function generateMetadata({ params }) {
  let Params = await params;
  let language = Params.lang?.split("-")[1];
  try {
    const metadata = await getHomeMetadata({ params: Params });

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
async function StructuredDataScript({ lang }): Promise<JSX.Element | null> {
  try {
    const structuredData = await GetStructuredData({ lang });
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
    return <></>;
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
async function HomePage({ params }) {
  let { lang } = await params;
  const [country, language] = lang.split("-");
  let currency = await getCurrency(country, language);
  const isRtl = language === "ar" || language === "ku";
  try {
    return (
      <>
        <Suspense fallback={<></>}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StructuredDataScript lang={lang} />
        </Suspense>
        <div
          className={`${
            isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
          }  bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]`}
        >
          <SearchIcon />
          <Suspense
            fallback={<MobileNavigationSkeleton />}
            key={`Navbar ${lang}`}
          >
            {/*@ts-expect-error Async Server Component is valid in Next  */}
            <MainCategoriesNavbar lang={lang} mainCategory={null} />
          </Suspense>
        </div>

        <Suspense fallback={<StoriesSkeleton />} key={`Stories ${lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StoriesBarServer
            language={lang.split("-")[1]}
            country={lang.split("-")[0]}
          />
        </Suspense>

        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FeaturedProductWrapper currency={currency} lang={lang} />
        </Suspense>
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}

          <FlashProductWrapper currency={currency} lang={lang} />
        </Suspense>
        <Home key={`Home ${lang}`} />
        <Suspense fallback={<OfferListSkeleton />} key={`OfferList ${lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <BoutiquesListWrapper currency={currency} params={{ lang: lang }} />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(error, `/${lang}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default HomePage;
// Main Categories Bar

// Featured Products
async function FeaturedProductWrapper({ lang, currency: currencyData }) {
  const [country, language] = lang?.split("-");
  let start = process.hrtime.bigint();
  let response: any = await api.products.featured.get({
    headers: { country: country, language: language },
    query: { limit: 10, offset: null },
  });
  let end = process.hrtime.bigint();
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.data.data.products.map((product) => {
    if (product?.is_redeem) {
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
        is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
      };
    } else
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
      };
  });

  return (
    <FeatureProducts
      dataSourceString={`Feature Products Data Source: Products From Elastic, currency from ${
        currencyData?.redis ? "redis" : "laravel api"
      } in ${Number(end - start) / 1_000_000} ms`}
      currencyData={currencyData}
      fetauredProductsData={{ data: { products: productsData } }}
      lang={lang}
    />
  );
}
// FlasDeals Products
async function FlashProductWrapper({ lang, currency: currencyData }) {
  const [country, language] = lang?.split("-");
  let start = process.hrtime.bigint();

  let response: any = await api.products.flashdeal.get({
    headers: { country: country, language: language },
    query: { limit: 10, offset: null },
  });
  let end = process.hrtime.bigint();
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.data.data.products.map((product) => {
    if (product?.is_redeem) {
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
        is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
      };
    } else
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
      };
  });
  return (
    <FlashDealsProducts
      dataSourceString={`FlashDeals Products Data Source: Products From Elastic, currency from ${
        currencyData?.redis ? "redis" : "laravel api"
      } in ${Number(end - start) / 1_000_000} ms`}
      currencyData={currencyData}
      flashDealsProducts={{ data: { products: productsData } }}
      lang={lang}
    />
  );
}

async function BoutiquesListWrapper({ params, currency: currencyData }) {
  const [country, language] = params.lang.split("-");

  let response = await api.home.boutiques.get({
    headers: { country: country, language: language },
    query: { limit: 10, offset: null },
  });
  // @ts-ignore
  let data: any = response.data.data ?? {};

  return (
    <OfferListServer boutiquesData={{ ...(data ?? {}) }} params={params}>
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        {/*@ts-expect-error Async Server Component is valid in Next  */}
        <RecomendedProductWrapper lang={params.lang} currency={currencyData} />
      </Suspense>
    </OfferListServer>
  );
}
async function RecomendedProductWrapper({
  lang,
  currency: currencyData,
}): Promise<JSX.Element> {
  const [country, language] = lang.split("-");
  const userId = ((await getCookieServer(COOKIE_NAMES.USER_DATA)) as any)?.id;
  let response = await api.products.recommended.get({
    headers: { language, country },
    query: {
      limit: 7,
      offset: null,
    },
  });
  return (
    <RecomendedProducts
      InitialProducts={(response.data as any).data.products}
      userId={userId}
      InitialOffset={(response.data as any).data.offset}
      lang={lang}
      currencyData={currencyData}
    />
  );
}
