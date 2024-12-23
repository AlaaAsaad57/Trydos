import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import ProductDetailsServer from "components/Server/ProductDetails";

import { getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";

export async function generateMetadata({ params, searchParams }) {
  const productId = params.productId;

  const metaData = await getProductMeta({ productId, lang: params.lang });
  if (!metaData?.name) {
    notFound();
  }
  return {
    title: `${metaData?.name} ${
      searchParams.color && `- ${searchParams.color}`
    }`,
    description: `${metaData?.name} - ${metaData?.description}`,
    openGraph: {
      title: `${metaData?.name} ${
        searchParams.color && `- ${searchParams.color}`
      }`,
      description: `${metaData?.name} - ${metaData?.description}`,
      images: [
        {
          url: metaData.photo,
          width: 300,
          height: 300,
        },
      ],
    },
  };
}

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "edge";

async function Page({ params: { productId, lang }, searchParams }) {
  return (
    <>
      <CustomNavbarServer lang={lang} />

      <ProductDetailsServer productId={productId} lang={lang} />
    </>
  );
}

export default Page;
