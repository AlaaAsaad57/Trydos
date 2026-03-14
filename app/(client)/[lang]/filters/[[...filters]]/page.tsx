export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { LogServerError } from "utils/serverErrorReporter";
import { translateFunction } from "utils/server";
import { generateMetadataForListing } from "serverRequests/meta/listing";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import FiltersPageContent from "components/Listing/FiltersPageContent";

export const dynamicParams = true;
export async function generateMetadata({ params }) {
  // Fetch your main product categories
  let Params = await params;
  try {
    const metadata = await generateMetadataForListing({
      params,
    });

    return metadata;
  } catch (error) {
    LogServerError(
      { error, type: "get page meta error", filters: Params.filters },
      `/${Params.lang}/filters`,
    );

    const [country, language] = Params?.lang?.split("-");
    const baseUrl = General_Site_Data.url;
    const filtersPath =
      Array.isArray(Params.filters) && Params.filters.length > 0
        ? `/${Params.filters.join("/")}`
        : "";
    const fullUrl = `${baseUrl}/${Params.lang}/filters${filtersPath}`;
    const ogImageUrl = `${baseUrl}/opengraph-image.png`;
    const title = translateFunction(
      "TryDos - Boutique & Product Listing",
      language,
    );
    const description = translateFunction(
      "Browse TryDos boutiques and products with powerful filters for brand, category, color, size, and more.",
      language,
    );

    return {
      title,
      description,
      alternates: {
        canonical: fullUrl,
      },
      openGraph: {
        title,
        description,
        url: fullUrl,
        siteName: "Trydos",
        type: "website",
        images: [{ url: ogImageUrl }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }
}
async function GetBoutique(boutique, country, language) {
  let start = process.hrtime.bigint();

  try {
    if (boutique) {
      let reader = new ElasticsearchReader();
      let boutiqueData = await reader.getBoutiqueInfo({
        country,
        language: language,
        slug: boutique,
      });
      if (!boutiqueData?.banners) {
        redirect(`/${country}-${language}?message=boutique_not_found`);
      }
      let end = process.hrtime.bigint();

      return { ...boutiqueData, time: Number(end - start) / 1_000_000 };
    } else {
      return {
        banners: null,
        name: "Search",
        time: 0,
      };
    }
  } catch (error) {
    LogServerError(
      {
        error,
        type: "get boutique details error",
        country,
        language,
        boutique,
      },
      `/${country}-${language}/featured`,
    );
    return {
      banners: null,
      name: "Search",
    };
  }
}
async function getCurrency(country, language) {
  let start = process.hrtime.bigint();
  try {
    let cachedCurrency = await getCurrencyFromCache(country);
    let end = process.hrtime.bigint();
    if (typeof cachedCurrency === "string") {
      return {
        ...JSON.parse(cachedCurrency),
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    }
    if (cachedCurrency?.exchange_rate) {
      return {
        ...cachedCurrency,
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    } else {
      let end = process.hrtime.bigint();
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data.currency };
      StoreCurrency(country, currency);
      return {
        ...currency,
        redis: false,
        time: Number(end - start) / 1_000_000,
      };
    }
  } catch (error) {}
}
export default async function Page({ params }) {
  const Params = await params;
  return <FiltersPageContent params={Params} />;
}
