import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import ProductDetailsServer from "components/Server/ProductDetails";

import { getConfiguredImage, getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";
import { metadata } from "../../layout";

export async function generateMetadata({ params, searchParams }) {
  const productId = params.productId;

  const metaData = await getProductMeta({
    productId,
    lang: params.lang,
    color: searchParams.color,
  });
  console.log(metaData);
  if (!metaData?.name) {
    notFound();
  }
  return {
    title: `${metaData?.name} ${
      searchParams.color ? `- ${searchParams.color}` : ""
    }`,
    description: `${metaData.details}`,
    openGraph: {
      title: `${metaData?.name} ${
        searchParams.color && `- ${searchParams.color}`
      }`,
      description: `${metaData.details}`,
      images: [
        {
          url: getConfiguredImage({
            src: metaData.photo.file_path,
            width: 600,
            height: 315,
          }),
          width: 600,
          height: 315,
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
