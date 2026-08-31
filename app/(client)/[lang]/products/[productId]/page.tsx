import { lang as langParam } from "next/root-params";
import { RedisSet } from "serverRequests/radis";
import { GetProductMeta } from "serverRequests/product";
import { redirect } from "next/navigation";
import { LogServerError } from "utils/serverErrorReporter";
import ProductPageContent from "components/Product/ProductPageContent";
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
    // browser. Emit empty metadata and let the page issue the real 307.
    // @ts-ignore
    if (metaData?.productNotFound) {
      return {};
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
      `/${country}-${language}/featured`,
    );
    return {};
  }
}

export default async function Page({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  const lang = await langParam();
  const [country, language] = lang.split("-");

  // Awaited on purpose: the page component is the last point that still blocks
  // the response, so it is the only place a not-found redirect can produce a
  // real 307. Same URL as generateMetadata's call, so Next's request
  // memoization collapses the two into one backend hit.
  const metaData = await GetProductMeta({
    country,
    language,
    slug: Params.productId,
    searchParams: SearchParams || {},
  });

  // Only a definitive 404 redirects — a transient failure returns undefined and
  // must still render the page.
  // @ts-ignore
  if (metaData?.productNotFound) {
    redirect(`/${country}-${language}?message=product_not_found`);
  }

  return (
    // @ts-ignore
    <ProductPageContent params={Params} searchParams={SearchParams || {}} />
  );
}
