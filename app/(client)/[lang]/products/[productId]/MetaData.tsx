// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";
import { GetProductData } from "utils/pagesDataRequests/ProductPageData";

export async function generateProductMetaData({ params, searchParams }) {
  try {
    let { product } = await GetProductData(params);
    let pageTitle = `${product.name}`;
    if (searchParams?.color) {
      pageTitle += ` |  ${searchParams?.color}`;
    }
    if (searchParams?.size) {
      pageTitle += ` |  ${searchParams?.size}`;
    }
    const pageDescription = `${product.details}`;
    let imagesArray = searchParams.color
      ? product?.sync_color_images?.find(
          (s) =>
            s.color_name === searchParams?.color ||
            s.color_option === searchParams?.color
        )?.images
      : product.sync_color_images
      ? product.sync_color_images?.map((s) => s.images[0])
      : product.images;

    const baseUrl =
      process.env.NEXT_PUBLIC_REMOTE_FRONT ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const primaryOgImage = `${baseUrl}/api/generate-og-images?title=${pageTitle}&description=${pageDescription}&images=${imagesArray?.join(
      ","
    )}&type=product`;

    //   const keywords = [
    //     boutique.name,
    //     ...(filters?.categories?.map((s) => s.name) || []),
    //     ...(filters?.brands?.map((s) => s.name) || []),
    //     ...(filters?.colors?.map((s) => s) || []),
    //     ...(filters?.sizes?.map((s) => s.name) || []),
    //     ...(filtersData?.products?.map((s) => s.name) || []),
    //   ]
    //     .filter(Boolean)
    //     .join(", ");

    const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/products/${product.slug}`;
    const keywords = [
      product.name,
      product.brand?.name,
      product.category?.name,
      ...(product.sync_color_images?.map((s) => s.color_name) || []),
      ...(product.categories.map((s) => s.name) || []),
      ...(product?.descriptors?.map((desc) => {
        return desc.descriptors?.map(
          (s) => `${s.value} - ${s?.descriptor?.name}`
        );
      }) || []),
    ];

    return {
      title: pageTitle,
      description: pageDescription,
      keywords: keywords,
      openGraph: {
        type: "website",
        title: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
        siteName: "TryDos",
        images: [primaryOgImage],
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: pageDescription,
        images: [primaryOgImage],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    return {
      title: "TryDos",
      error: true,
      description: "TryDos",
      openGraph: {
        type: "website",
      },
    };
  }
}
