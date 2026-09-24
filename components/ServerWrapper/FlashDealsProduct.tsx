import { connection } from "next/server";

import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { getCachedFlashDeals } from "serverRequests/cached/home";

/**
 * The flash-deal row.
 *
 * The products come from a cached reader, so this wrapper holds no request-bound
 * read of its own — no cookie, no header, no clock. The deal window is decided
 * by Elasticsearch date math, not by a timestamp baked into the cache entry.
 */
export async function FlashProductWrapper({
  lang,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = lang?.split("-");

  // Wait for the request before rendering a single card, for the same reason as
  // the featured row beside it — see components/ServerWrapper/FeaturedProduct.tsx.
  // A product card cannot be prerendered, so without this point to stop at React
  // leaves the whole boundary to the browser and the row's skeleton collapses
  // before the cards paint.
  await connection();

  const [products, currency] = await Promise.all([
    getCachedFlashDeals(country, language, mainCategory),
    currencyData,
  ]);

  return (
    <FlashDealsProducts
      currencyData={currency}
      flashDealsProducts={{ data: { products } }}
      lang={lang}
    />
  );
}
