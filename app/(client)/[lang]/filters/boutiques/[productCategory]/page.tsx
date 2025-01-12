import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";

// export async function generateMetadata({ params, searchParams }) {
//   const boutiqueId = params.productCategory;
//   const metaData =
//     boutiqueId === "listing"
//       ? { name: "listing" }
//       : await getBoutiqueMeta({ boutiqueId, lang: params.lang });
//   if (!metaData?.name) {
//     notFound();
//   }
//   if (boutiqueId === "listing") {
//     return {
//       title: `Trydos - ${searchParams.search_text} `,
//       description: ``,
//     };
//   }
//   return {
//     title: `Trydos - ${metaData?.name} `,
//     description: `${metaData?.description} `,
//     openGraph: {
//       title: metaData?.name,
//       description: `${metaData?.description} `,
//       url: process.env.NEXT_PUBLIC_BASE_SITE_URL + `boutiques/${boutiqueId}`,
//       images: metaData?.photo,
//     },
//   };
// }

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

interface Props {
  params: {
    lang: string;
    productCategory: string;
  };
  searchParams: {
    categories: string;
    prices: string;
    search_text: string;
    brands: string;
    colors: string;
  };
}
async function Page({ params, searchParams }: Props) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />

      <ProductListServer searchParams={searchParams} params={params} />
    </>
  );
}

export default Page;
