import ProductPageContent from "components/Product/ProductPageContent";
import ProductNotFoundRedirect from "components/Product/ProductNotFoundRedirect";
import { GetProductMeta } from "serverRequests/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InterceptedProductPage({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const [country, language] = Params.lang.split("-");

  // Awaited before anything renders so a missing product never paints the empty
  // shell (NaN prices, blank slider) inside the modal. The full-page route does
  // the same check and redirects on the server; this slot cannot — see
  // ProductNotFoundRedirect for why — so it hands the redirect to the client.
  const metaData = await GetProductMeta({
    country,
    language,
    slug: Params.productId,
    searchParams: SearchParams || {},
  });

  // Only a definitive 404 redirects. A transient failure returns undefined and
  // must still render the product, exactly as on the full page.
  // @ts-ignore
  if (metaData?.productNotFound) {
    return (
      <ProductNotFoundRedirect
        href={`/${country}-${language}?message=product_not_found`}
      />
    );
  }

  return (
    // @ts-ignore
    <ProductPageContent params={Params} searchParams={SearchParams || {}} />
  );
}
