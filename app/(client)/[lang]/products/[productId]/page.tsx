export const runtime = "nodejs";
export const revalidate = 60;
import { RedisSet } from "serverRequests/radis";
import { GetProductMeta } from "serverRequests/product";
import { redirect } from "next/navigation";
import { LogServerError } from "utils/serverErrorReporter";
import ProductPageContent from "components/Product/ProductPageContent";

export async function generateMetadata({ params, searchParams }) {
  let [Params, SearchParams] = await Promise.all([params, searchParams]);
  let [country, language] = Params.lang.split("-");
  try {
    const metaData = await GetProductMeta({
      country: country,
      language: language,
      slug: Params.productId,
      searchParams: SearchParams,
    });

    // @ts-ignore
    if (metaData?.error || !metaData) {
      // @ts-ignore
      throw new Error(metaData?.error ?? metaData);
    }
    RedisSet(`${Params.productId}-${Params.lang}`, JSON.stringify(metaData));

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
    redirect(`/${country}-${language}?message=product_not_found`);
  }
}

export default async function Page({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  return (
    // @ts-ignore
    <ProductPageContent params={Params} searchParams={SearchParams || {}} />
  );
}
