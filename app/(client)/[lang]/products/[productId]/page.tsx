import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import ProductDetailsServer from "components/Server/ProductDetails";

import { getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const productId = params.productId;
  const metaData = await getProductMeta({ productId, lang: params.lang });
  if (!metaData?.name) {
    notFound();
  }
  return {
    title: metaData?.name,
    description: metaData?.description,
  };
}

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "edge";

async function Page({ params: { productId, lang } }) {
  return (
    <>
      <CustomNavbarServer lang={lang} />

      <ProductDetailsServer productId={productId} lang={lang} />
    </>
  );
}

export default Page;
