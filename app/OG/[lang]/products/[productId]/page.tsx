export const runtime = "nodejs";
export const revalidate = 3600;

import { GetProductMeta } from "serverRequests/product";
import { RedisSet } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

// This page is dynamically rendered (searchParams access) so every request
// hits this function. A 3-second ceiling ensures WhatsApp's bot always gets
// a response within its unfurl timeout — the fallback uses the static OG image
// so at least title + image are shown on the first cold visit.
const METADATA_TIMEOUT_MS = 3000;

export async function generateMetadata({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const [country, language] = Params.lang.split("-");
  const fallbackImageUrl = General_Site_Data.url + General_Site_Data.og;

  const buildFallback = (title = "TryDos", description = "") => ({
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Trydos",
      type: "website" as const,
      images: [{ url: fallbackImageUrl, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [fallbackImageUrl],
    },
  });

  try {
    const metaData = await Promise.race([
      GetProductMeta({ country, language, slug: Params.productId, searchParams: SearchParams }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("metadata_timeout")), METADATA_TIMEOUT_MS),
      ),
    ]);

    // @ts-ignore
    if (metaData?.error || !metaData) {
      // @ts-ignore
      throw new Error(metaData?.error ?? "No metadata");
    }

    RedisSet(`${Params.productId}-${Params.lang}`, JSON.stringify(metaData));
    // buildOgImageUrl inside GetProductMeta already guarantees f_jpg — return as-is.
    return metaData;
  } catch (error) {
    if ((error as Error)?.message !== "metadata_timeout") {
      LogServerError(
        {
          error,
          type: "og product meta",
          country,
          language,
          product_slug: Params.productId,
        },
        `/OG/${Params.lang}/products/${Params.productId}`,
      );
    }
    return buildFallback();
  }
}

export default function OGPage() {
  return null;
}
