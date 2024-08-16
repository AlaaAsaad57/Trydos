import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
import DetailsSekeleton from "components/skeleton/details";
import NavbarSkeleton from "components/skeleton/navbar";
import ProductDetailsServer from "components/Server/ProductDetails";
import { getProductMeta } from "utils/functions";
import { notFound } from "next/navigation";
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

function Page({ params: { productId, lang } }) {
  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
        <CustomNavbarServer lang={lang} />
      </Suspense>

      <Suspense fallback={<DetailsSekeleton />}>
        <ProductDetailsServer productId={productId} lang={lang} />
      </Suspense>
    </>
  );
}

export default Page;
