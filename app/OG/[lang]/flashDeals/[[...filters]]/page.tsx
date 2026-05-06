export const runtime = "nodejs";
export const revalidate = 3600;
export const dynamicParams = true;

import { generateMetadataForListing } from "serverRequests/meta/listing";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { translateFunction } from "utils/server";

export async function generateMetadata({ params }) {
  const Params = await params;
  try {
    return await generateMetadataForListing({ params });
  } catch (error) {
    LogServerError(
      { error, type: "og flashDeals meta" },
      `/OG/${Params.lang}/flashDeals`,
    );
    const [country, language] = Params?.lang?.split("-");
    const baseUrl = General_Site_Data.url;
    const filtersPath =
      Array.isArray(Params.filters) && Params.filters.length > 0
        ? `/${Params.filters.join("/")}`
        : "";
    const fullUrl = `${baseUrl}/${Params.lang}/flashDeals${filtersPath}`;
    const ogImageUrl = `${baseUrl}/opengraph-image.png`;
    const title = translateFunction("TryDos - Flash Deals", language);
    const description = translateFunction(
      "Grab limited-time flash deals on TryDos - amazing discounts on premium products.",
      language,
    );
    return {
      title,
      description,
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

export default function OGPage() {
  return null;
}
