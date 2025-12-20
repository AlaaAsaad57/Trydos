export const runtime = "nodejs";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";
import Home from "components/Home";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";

import { fetchCurrency } from "serverRequests";

import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import MainCategoriesNavbar from "components/Server/MainCategories";
import { LogServerError } from "utils/serverErrorReporter";
import { api } from "lib/eden";
import SearchIcon from "components/Home/Search/SearchIcon";
import { FeaturedProductWrapper } from "../../ServerWrapper/FeaturedProduct";
import { FlashProductWrapper } from "../../ServerWrapper/FlashDealsProduct";
import { BoutiquesListWrapper } from "../../ServerWrapper/BoutiquesListWrapper";

export async function generateMetadata({ params }) {
  try {
    let Params = await params;
    let [country, language] = Params.lang.split("-");
    const metadata = await api.home.meta.get({
      query: { country, language, mainCategory: Params.mainCategory },
    });

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
// async function StructuredDataScript({ params }) {
//   try {
//     let Params = await params;
//     const structuredData = await GetStructuredData({ lang: Params.lang });
//     // console.log(
//     //   "**********structuredData***********",
//     //   JSON.stringify(structuredData)
//     // );

//     if (!structuredData) return null;

//     return (

//     );
//   } catch (error) {
//     console.error("Error generating structured data:", error);
//     return null;
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
async function CategoryPage({ params }) {
  let Params = await params;
  const [country, language] = Params.lang.split("-");
  let currency = await getCurrency(country, language);
  const isRtl = language === "ar" || language === "ku";
  try {
    return (
      <>
        {/* <StructuredDataScript params={Params} /> */}
        <div
          className={`${
            isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
          }  bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]`}
        >
          <SearchIcon />
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
        </div>
        <Suspense fallback={<StoriesSkeleton />} key={`Stories ${Params.lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StoriesBarServer
            language={Params.lang.split("-")[1]}
            country={Params.lang.split("-")[0]}
          />
        </Suspense>

        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FeaturedProductWrapper
            currency={currency}
            lang={Params.lang}
            mainCategory={Params.mainCategory}
          />
        </Suspense>
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FlashProductWrapper
            currency={currency}
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
          <BoutiquesListWrapper
            currency={currency}
            params={Params}
            mainCategory={Params.mainCategory}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(error, `/${Params.lang}/categories/${Params.mainCategory}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default CategoryPage;
// Main Categories Bar

// Featured Products
