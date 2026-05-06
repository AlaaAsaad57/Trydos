export const runtime = "nodejs";
export const revalidate = 36000;

import { GetProductMeta } from "serverRequests/product";
import { RedisSet } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";

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
    return {};
  }
}

export default function OGPage() {
  return null;
}
