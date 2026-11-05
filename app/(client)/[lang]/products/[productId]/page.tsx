import { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import { RedisSet } from "serverRequests/radis";
import { GetProductMeta } from "serverRequests/product";
import { LogServerError } from "utils/serverErrorReporter";
import ProductPageContent from "components/Product/ProductPageContent";
import ProductPageSkeleton from "components/Product/ProductPageSkeleton";
import { Metadata } from "next";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({ params, searchParams }): Promise<Metadata>{
  let [Params, SearchParams] = await Promise.all([params, searchParams]);
  const lang = await langParam();
  let [country, language] = lang.split("-");
  try {
    const metaData = await GetProductMeta({
      country: country,
      language: language,
      slug: Params.productId,
      searchParams: SearchParams,
    });

    // Missing product: the redirect is owned by the page component below, not
    // here. Metadata is streamed in Next 16 — it resolves after the 200 shell
    // has already been flushed, so a redirect thrown from this function only
    // ever lands as a failed boundary in the RSC stream and never navigates the
    // browser. That answer is a 200, so tell search engines not to keep it.
    // @ts-ignore
    if (metaData?.productNotFound) {
      return { robots: { index: false, follow: false } };
    }

    // @ts-ignore
    if (metaData?.error || !metaData) {
      // @ts-ignore
      throw new Error(metaData?.error ?? metaData);
    }
    RedisSet(`${Params.productId}-${lang}`, JSON.stringify(metaData));

    return metaData;


  } catch (error) {
    LogServerError(
      {
        error,
        type: "get product meta error",
        country,
        language,
        product_slug: Params.productId,
      },
      `/${country}-${language}/products/${Params.productId}`,
    );
    return {};
  }
}

async function Product({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const lang = await langParam();
  const [country, language] = lang.split("-");

  // Not awaited: it runs beside the product's first reads. The content leaves
  // through Next's meta tag for a missing product, not a 307 (owner's decision:
  // the fast page matters more). Same read as generateMetadata's.
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
    />
  );
}

export default function Page({ params, searchParams }) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <Product params={params} searchParams={searchParams} />
    </Suspense>
  );
}
