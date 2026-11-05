import { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import ProductPageContent from "components/Product/ProductPageContent";
import ProductPageSkeleton from "components/Product/ProductPageSkeleton";
import NotFoundRedirect from "components/global/NotFoundRedirect";
import { GetProductMeta } from "serverRequests/product";

// Instant navigation (Next 16.3). A tap inside the app lands on this copy of the
// page, so its shell is prefetched and the skeleton shows with no server wait.
// `instant = false` is needed with it: the root layout's client parts read the
// URL outside <Suspense>, and the prefetch still carries this page's skeleton.
export const prefetch = "partial";
export const instant = false;

async function Product({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const lang = await langParam();
  const [country, language] = lang.split("-");

  // Awaited before anything renders so a missing product never paints the empty
  // shell (NaN prices, blank slider) inside the modal. The full-page route does
  // the same check and redirects on the server; this slot cannot — see
  // NotFoundRedirect for why — so it hands the redirect to the client.
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
      <NotFoundRedirect
        href={`/${country}-${language}?message=product_not_found`}
      />
    );
  }

  return (
    // @ts-ignore
    <ProductPageContent
      params={Params}
      searchParams={SearchParams || {}}
    />
  );
}

export default function InterceptedProductPage({ params, searchParams }) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <Product params={params} searchParams={searchParams} />
    </Suspense>
  );
}
