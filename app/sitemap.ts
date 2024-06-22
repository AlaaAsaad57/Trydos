import { getBoutiquesUrl, getProductsUrl } from "utils/functions";

export default async function sitemap() {
  const baseUrl =
    "https://trydos-git-development-yasseromranramaazcoms-projects.vercel.app";
  const boutiques = await getBoutiquesUrl();
  const postsUrls =
    boutiques?.map((boutique) => {
      return {
        url: `${baseUrl}/boutiques/${boutique.slug}`,
        lastModified: new Date(),
      };
    }) ?? [];

  const products = await getProductsUrl();
  const categoriesUrls =
    products?.map((product) => {
      return {
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(),
      };
    }) ?? [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...postsUrls,
    ...categoriesUrls,
  ];
}
