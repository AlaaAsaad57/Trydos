import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import ProductDetailsServer from "components/Server/ProductDetails";
import { getListingDataProd } from "store/homepage/cachedActions";

// export async function generateMetadata({ params }) {
//   const productId = params.productId;
//   const metaData = await getProductMeta({ productId, lang: params.lang });
//   if (!metaData?.name) {
//     notFound();
//   }
//   return {
//     title: metaData?.name,
//     description: metaData?.description,
//     openGraph: {
//       title: metaData?.name,
//       description: `${metaData?.description} `,
//       url: process.env.NEXT_PUBLIC_BASE_SITE_URL + `/products/${productId}`,
//       images: metaData?.photo,
//     },
//   };
// }

export const revalidate = 3600;
async function Page({ params: { productId, lang } }) {
  return (
    <>
      <CustomNavbarServer lang={lang} />

      <ProductDetailsServer productId={productId} lang={lang} />
    </>
  );
}

export default Page;
