export const runtime = "nodejs";
export const revalidate = 60;
import { RedisSet } from "serverRequests/radis";
import { GetProductMeta } from "serverRequests/product";
import { redirect } from "next/navigation";
import { LogServerError } from "utils/serverErrorReporter";
import ProductPageContent from "components/Product/ProductPageContent";
import { Metadata } from "next";

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
export const metadata:Metadata={
title:"TRYDOS-TEST",
description:"TRYDOS-TEST",
openGraph:{
  type:"website",
  url:"https://dev.trydos.com",
  images:{url:"https://media_server.ramaaz.dev/image/upload/w_1200,h_630,c_pad/f_jpg/q_90/product/yz2p0gvbrmr8fnzd2w27.png",width:'1200',height:'630',alt:"TRYDOS-TEST"}
}
}
export default async function Page({ params, searchParams }) {
  const [Params, SearchParams] = await Promise.all([params, searchParams]);
  return (
    // @ts-ignore
    <ProductPageContent params={Params} searchParams={SearchParams || {}} />
  );
}
