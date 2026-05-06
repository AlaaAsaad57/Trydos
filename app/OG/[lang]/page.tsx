export const revalidate = 36000;

import { GetHomeMetaData } from "serverRequests/meta/home";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { translateFunction } from "utils/server";

export async function generateMetadata({ params, searchParams }) {
  const [Params, query] = await Promise.all([params, searchParams]);
  const mainCategory = query?.mainCategory || null;
  try {
    const metadata = await GetHomeMetaData({
      local: Params.lang,
      category: mainCategory,
    });
    return { ...metadata };
  } catch (error) {
    LogServerError({ error, type: "og home meta" }, `/OG/${Params.lang}`);
    const [country, language] = Params.lang.split("-");
    const baseUrl = General_Site_Data.url;
    const path = mainCategory ? `?mainCategory=${mainCategory}` : "";
    const fullUrl = `${baseUrl}/${Params.lang}${path}`;
    const ogImageUrl = baseUrl + General_Site_Data.og;
    const title = translateFunction(
      "TryDos - Premium Shopping Experience",
      language,
    );
    const description = translateFunction(
      "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
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
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
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
