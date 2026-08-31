import FeatureProducts from "components/Server/FeatureProducts";
import { getCachedFeatured } from "serverRequests/cached/home";

/**
 * The featured row.
 *
 * The products come from a cached reader, so this wrapper holds no request-bound
 * read of its own — no cookie, no header, no clock. `currency` is still awaited
 * because the home page hands it over as an unresolved promise, which is what
 * lets the currency fetch overlap the product fetch.
 */
export async function FeaturedProductWrapper({
  lang,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = lang?.split("-");

  const [products, currency] = await Promise.all([
    getCachedFeatured(country, language, mainCategory),
    currencyData,
  ]);

  return (
    <FeatureProducts
      currencyData={currency}
      fetauredProductsData={{ data: { products } }}
      lang={lang}
    />
  );
}
