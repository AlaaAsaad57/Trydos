export const runtime = "nodejs";
export const revalidate = 3600;

import { GetProductMeta } from "serverRequests/product";
import { RedisSet } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

// Force JPEG for OG images — bot servers may not send Accept headers that
// trigger Cloudinary's f_auto format negotiation, so webp/avif won't be served.
function toJpgOgUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  return url.includes("/f_auto/") ? url.replace("/f_auto/", "/f_jpg/") : url;
}

export async function generateMetadata({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const [country, language] = Params.lang.split("-");
  try {
    const metaData = await GetProductMeta({
      country,
      language,
      slug: Params.productId,
      searchParams: SearchParams,
    });

    // @ts-ignore
    if (metaData?.error || !metaData) {
      // @ts-ignore
      throw new Error(metaData?.error ?? "No metadata");
    }

    RedisSet(`${Params.productId}-${Params.lang}`, JSON.stringify(metaData));

    // Fix image format for maximum bot compatibility
    const ogImages = (metaData as any)?.openGraph?.images;
    const rawUrl = Array.isArray(ogImages) ? (ogImages[0] as any)?.url : null;
    const jpgUrl = toJpgOgUrl(rawUrl);
    if (jpgUrl) {
      return {
        ...metaData,
        openGraph: {
          ...(metaData as any).openGraph,
          images: [{ url: jpgUrl, width: 1200, height: 630 }],
        },
        twitter: {
          ...(metaData as any).twitter,
          images: [jpgUrl],
        },
      };
    }

    return metaData;
  } catch (error) {
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
    // Return minimal fallback so bots at least get a title
    const fallbackImageUrl = General_Site_Data.url + General_Site_Data.og;
    return {
      title: "TryDos",
      openGraph: {
        siteName: "Trydos",
        type: "website",
        images: [{ url: fallbackImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        images: [fallbackImageUrl],
      },
    };
  }
}

export default function OGPage() {
  return null;
}
