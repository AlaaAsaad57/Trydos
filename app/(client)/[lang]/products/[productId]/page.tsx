import "styles/productDetails.css";

import ProductDetailsServer from "components/Server/ProductDetails";

import { getConfiguredImage, getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";
import { getProducts } from "store/homepage/cachedActions";

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"]; // For Middle East users

export async function generateMetadata({ params, searchParams }) {
  const productId = params.productId;
  try {
    const metaData = await getProductMeta({
      productId,
      lang: params.lang,
      color: searchParams.color,
    });
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
  } catch (error) {
    notFound();
  }
}
export const dynamicParams = true;
export async function generateStaticParams({ params }) {
  try {
    const products = await getProducts({
      lang: params.lang ? params.lang.split("-")[1] : null,
      country: params.lang ? params.lang.split("-")[0] : null,
    });
    return products.map((product) => ({
      productId: product,
      lang: params.lang,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

interface Props {
  params: {
    lang: string;
    productId: string;
  };
}
function Page({ params }: Props) {
  return (
    <>
      <ProductDetailsServer productId={params.productId} lang={params.lang} />
    </>
  );
}

export default Page;
