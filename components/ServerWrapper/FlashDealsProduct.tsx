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
