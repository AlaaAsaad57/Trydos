export const runtime = "nodejs";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
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
import { getHomeMetadata, GetStructuredData } from "../../MetaData";
import { fetchCurrency } from "serverRequests";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import MainCategoriesNavbar from "components/Server/MainCategories";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

export async function generateMetadata({ params }) {
  try {
    let Params = await params;
    const metadata = await getHomeMetadata({ params: Params });

    // console.log("**********metadata***********", JSON.stringify(metadata));
    return { ...metadata };
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
    let Params = await params;
    const structuredData = await GetStructuredData({ lang: Params.lang });
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
      let currency = currencyData.data.currency;

      StoreCurrency(country, currency);
      return { ...currency, redis: false };
    }
  } catch (error) {}
}
async function HomePage({ params }) {
  let Params = await params;
  try {
    return (
      <>
        <Suspense fallback={null}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StructuredDataScript params={Params} />
        </Suspense>

        <Suspense
          fallback={<MobileNavigationSkeleton />}
          key={`Navbar ${Params.lang}`}
        >
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <MainCategoriesNavbar
            lang={Params.lang}
            mainCategory={Params.mainCategory}
          />
        </Suspense>

        <Suspense fallback={<StoriesSkeleton />} key={`Stories ${Params.lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StoriesBarServer
            language={Params.lang.split("-")[1]}
            country={Params.lang.split("-")[0]}
          />
        </Suspense>

        <Suspense fallback={<FeaturedProductsSkeleton lang={Params.lang} />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FeaturedProductWrapper
            lang={Params.lang}
            mainCategory={Params.mainCategory}
          />
        </Suspense>
        <Suspense fallback={<FeaturedProductsSkeleton lang={Params.lang} />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FlashProductWrapper
            lang={Params.lang}
            mainCategory={Params.mainCategory}
          />
        </Suspense>
        <Home key={`Home ${Params.lang}`} />
        <Suspense
          fallback={<OfferListSkeleton />}
          key={`OfferList ${Params.lang}`}
        >
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <BoutiquesListWrapper params={Params} />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(error, `/${Params.lang}/categories/${Params.mainCategory}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default HomePage;
// Main Categories Bar

// Featured Products
async function FeaturedProductWrapper({ lang, mainCategory }) {
  const [country, language] = lang?.split("-");

  let currencyData = await getCurrency(country, language);
  let data = await getProductsAndFiltersFromElastic({
    country: country,
    language_code: language,
    filters: {
      featured: true,
      categories: mainCategory ? [mainCategory] : null,
    },
    limit: 10,
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = data.products.map((product) => {
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
        product_id: product.product_id,
      };
  });
  return (
    <FeatureProducts
      dataSourceString={""}
      currencyData={currencyData}
      fetauredProductsData={{ data: { ...data, products: productsData } }}
      lang={lang}
    />
  );
}
// FlasDeals Products
async function FlashProductWrapper({ lang, mainCategory }) {
  const [country, language] = lang?.split("-");

  let currencyData = await getCurrency(country, language);
  let data = await getProductsAndFiltersFromElastic({
    country: country,
    language_code: language,
    filters: {
      flashdeal: true,
      categories: mainCategory ? [mainCategory] : null,
    },
    limit: 10,
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = data.products.map((product) => {
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
      dataSourceString={""}
      currencyData={currencyData}
      flashDealsProducts={{ data: { ...data, products: productsData } }}
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
      children={<></>}
      dataSourceString=""
      boutiquesData={{ ...data, temp: Number(end - start) / 1_000_000 }}
      params={params}
    />
  );
}
