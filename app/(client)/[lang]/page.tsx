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
import { fetchCurrency } from "serverRequests";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import RecomendedProducts from "components/Server/RecomendedProducts";
import MainCategoriesNavbar from "components/Server/MainCategories";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import SearchIcon from "components/Home/Search/SearchIcon";
import { api } from "lib/eden";
import { BoutiquesListWrapper } from "./ServerWrapper/BoutiquesListWrapper";
import { FlashProductWrapper } from "./ServerWrapper/FlashDealsProduct";
import { FeaturedProductWrapper } from "./ServerWrapper/FeaturedProduct";

export async function generateMetadata({ params }) {
  try {
    let Params = await params;
    let [country, language] = Params.lang.split("-");
    const metadata = await api.home.meta.get({ query: { country, language } });

    return { ...metadata };
  } catch (error) {
    return {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
    };
  }
}

// Server component to render JSON-LD structured data
// async function StructuredDataScript({ lang }): Promise<JSX.Element | null> {
//   try {
//     const structuredData = await GetStructuredData({ lang });
//     // console.log(
//     //   "**********structuredData***********",
//     //   JSON.stringify(structuredData)
//     // );

//     if (!structuredData) return null;

//     return (
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{
//           __html: JSON.stringify(structuredData),
//         }}
//       />
//     );
//   } catch (error) {
//     console.error("Error generating structured data:", error);
//     return <></>;
//   }
// }
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
        {/* <StructuredDataScript lang={lang} /> */}

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

// FlasDeals Products
