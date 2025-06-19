// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";

export async function generateProductMetaData({ params, searchParams }) {
  try {
    const getProductData = async () => {
      try {
        let response = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL +
            `/api/${params.lang}/products/${params.productId}`,
          {
            next: {
              revalidate: parseInt(
                process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS
              ),
              tags: [`product-details`, `product-${params.productId}`],
            },
          }
        );
        let data = await response.json();
        return data;
      } catch (error) {
        console.log(error);
        return {};
      }
    };
    let product = await getProductData();

    let pageTitle = `${product.name}`;
    if (searchParams?.color) {
      pageTitle += ` |  ${searchParams?.color}`;
    }
    if (searchParams?.size) {
      pageTitle += ` |  ${searchParams?.size}`;
    }
    const pageDescription = `${product.details}`;

    const ogImage =
      product?.sync_color_images?.find(
        (s) => s.color_name === searchParams?.color
      )?.images?.[0]?.file_path ?? product.images[0].file_path;

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

    const canonicalUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${product.slug}`;
    const getImages = () => {
      return (
        (product?.sync_color_images
          ?.find((s) => s.color_name === searchParams?.color)
          ?.images?.map((s) => ({
            url: getConfiguredImage({
              src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + s,
              width: 1200,
              height: 630,
              q: 80,
            }),
            width: 1200,
            height: 630,
            alt: product.name,
          }))?.length > 0 &&
          product?.sync_color_images
            ?.find((s) => s.color_name === searchParams?.color)
            ?.images?.map((s) => ({
              url: getConfiguredImage({
                src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + s,
                width: 1200,
                height: 630,
                q: 80,
              }),
              width: 1200,
              height: 630,
              alt: product.name,
            }))) ||
        (product.images?.map((s) => ({
          url: getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + s,
            width: 1200,
            height: 630,
            q: 80,
          }),
          width: 1200,
          height: 630,
          alt: product.name,
        }))?.length > 0 &&
          product.images?.map((s) => ({
            url: getConfiguredImage({
              src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + s,
              width: 1200,
              height: 630,
              q: 80,
            }),
            width: 1200,
            height: 630,
            alt: product.name,
          })))
      );
    };

    return {
      title: pageTitle,
      description: pageDescription,
      // keywords,
      openGraph: {
        type: "website",
        title: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
        siteName: "TryDos",
        images: getImages(),
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: pageDescription,
        images: [
          getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
            width: 1200,
            height: 630,
            q: 80,
          }),
          getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
            width: 800,
            height: 418,
            q: 80,
          }),
          getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
            width: 400,
            height: 209,
            q: 80,
          }),
          getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
            width: 200,
            height: 104,
            q: 80,
          }),
          getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
            width: 100,
            height: 52,
            q: 80,
          }),
        ],
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
