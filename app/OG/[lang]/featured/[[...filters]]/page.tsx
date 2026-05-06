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
      { error, type: "og featured meta" },
      `/OG/${Params.lang}/featured`,
    );
    const [country, language] = Params?.lang?.split("-");
    const baseUrl = General_Site_Data.url;
    const filtersPath =
      Array.isArray(Params.filters) && Params.filters.length > 0
        ? `/${Params.filters.join("/")}`
        : "";
    const fullUrl = `${baseUrl}/${Params.lang}/featured${filtersPath}`;
    const ogImageUrl = `${baseUrl}/opengraph-image.png`;
    const title = translateFunction("TryDos - Featured Products", language);
    const description = translateFunction(
      "Explore featured products on TryDos - hand-picked quality items from top boutiques.",
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
