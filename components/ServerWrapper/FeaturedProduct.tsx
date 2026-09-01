import { connection } from "next/server";

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

  // Wait for the request before rendering a single card.
  //
  // A product card cannot be prerendered. With nothing here to stop at, React
  // gave up on server-rendering this whole <Suspense> boundary and left it to
  // the browser. Measured on a production build: the boundary resolved with the
  // row's header link and nothing else, so the 457px skeleton was replaced by a
  // 50px header, the boutiques below jumped 884px up, and the cards appeared
  // only after hydration — 733ms of empty space on every page load. The
  // products were in the document the whole time, as streaming payload rather
  // than as HTML.
  //
  // `connection()` is the point React can stop at. The prerender ends here, and
  // at request time the rest of the row is rendered on the server and streamed
  // as real HTML. It costs no backend call: the products still come from the
  // cached reader below. See the Next guide on migrating to Cache Components,
  // "Fix synchronous IO. It can't be deferred."
  await connection();

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
