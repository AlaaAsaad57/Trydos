export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { permanentRedirect } from "next/navigation";
import { LogServerError } from "utils/serverErrorReporter";
import { translateFunction } from "utils/server";
import { generateMetadataForListing } from "serverRequests/meta/listing";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import FiltersPageContent from "components/Listing/FiltersPageContent";
import { buildSearchRedirectTarget } from "utils/listing/searchPathRedirect";

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

export default async function Page({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};

  const legacy = buildSearchRedirectTarget(
    Params.lang,
    "filters",
    Params.filters,
    sp,
  );
  if (legacy) permanentRedirect(legacy); // 308, method-preserving

  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // @ts-ignore
  return <FiltersPageContent params={Params} sort={sort} search={search} />;
}
