import ProductListServer from "components/Server/ProductList";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { getHomeDataStatic } from "store/homepage/cachedActions";

// import ListingSkeleton from "components/skeleton/listing";
// import NavbarSkeleton from "components/skeleton/navbar";
// import { notFound } from "next/navigation";
// import { Suspense } from "react";
// import { getBoutiqueMeta } from "utils/functions";

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

export const revalidate = 36000;
export const dynamicParams = true;
export const generateStaticParams = async () => {
  const HomeData = await getHomeDataStatic();
  let arr = [
    { lang: "tr-en" },
    { lang: "tr-ar" },
    { lang: "lb-en" },
    { lang: "lb-ar" },
  ].map((l) => {
    return HomeData.map((s) => {
      return { slug: s.slug, lang: l.lang };
    });
  });

  return arr.flat().map((s) => ({
    lang: s.lang,
    productCategory: s.slug,
  }));
};

async function Page({ params, searchParams }) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />

      <ProductListServer searchParams={searchParams} params={params} />
    </>
  );
}

export default Page;
