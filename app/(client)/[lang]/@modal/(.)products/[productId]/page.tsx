import { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import ProductPageContent from "components/Product/ProductPageContent";
import ProductPageSkeleton from "components/Product/ProductPageSkeleton";
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

  // Not awaited: it runs beside the product's first reads. The content checks it
  // before drawing, so a missing product never paints an empty page.
  const meta = GetProductMeta({
    country,
    language,
    slug: Params.productId,
    searchParams: SearchParams || {},
  });

  return (
    <ProductPageContent
      params={Params}
      searchParams={SearchParams || {}}
      meta={meta}
      intercepted
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
