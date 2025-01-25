import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import ProductDetailsServer from "components/Server/ProductDetails";

import { getConfiguredImage, getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";

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

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

interface Props {
  params: {
    lang: string;
    productId: string;
  };
}
async function Page({ params }: Props) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />

      <ProductDetailsServer productId={params.productId} lang={params.lang} />
    </>
  );
}

export default Page;
