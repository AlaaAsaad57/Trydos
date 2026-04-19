import ProductPageContent from "components/Product/ProductPageContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InterceptedProductPage({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  return (
    // @ts-ignore
    <ProductPageContent params={Params} searchParams={SearchParams || {}} />
  );
}
