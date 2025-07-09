// components/BoutiqueHead.tsx

import { generateCloudinaryUrl } from "utils/tinyUtils";

export async function generateProductMetaData({ params, searchParams }) {
  try {
    const [country, language] = params.lang.split("-");

    let product;
    let title = `${product?.name}`;
    if (searchParams.color) {
      title += ` |  ${searchParams.color}`;
    }
    if (searchParams.size) {
      title += ` |  ${searchParams.size}`;
    }
    let image = product?.images
      ? generateCloudinaryUrl({
          publicIds: product?.images,
          width: 1200,
          height: 630,
          overlayText: title,
        })
      : null;
    let data = {
      title: title,
      description: product?.details,
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product?.slug}`,
        languages: {
          en: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en/products/${product?.slug}`,
          tr: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-tr/products/${product?.slug}`,
          ar: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-ar/products/${product?.slug}`,
        },
      },
      openGraph: {
        title: title,
        description: product?.details,
        url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product?.slug}`,
        siteName: "Trydos",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: "product",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: product?.details,
        images: [image],
      },
      canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product?.slug}`,

      keywords: [
        product?.name,
        product?.brand?.name,
        product?.category?.name,
        ...(product?.similar_words || []),
      ],
    };
    console.log(data, "data");
    return data;
  } catch (error) {
    console.log(error, "error");
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
export const GetStructuredData = ({ params, product, color }) => {
  let imagesArray = product?.images;
  if (color) {
    imagesArray = product?.sync_color_images.find(
      (s) => s.color.name === color
    )?.images;
  }
  let image = imagesArray
    ? generateCloudinaryUrl({
        publicIds: imagesArray,
        width: 1200,
        height: 630,
        overlayText: product?.name,
      })
    : null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.name,
    image: image,
    description: product?.details,
    sku: product?.slug,
    category: product?.category?.name,
    brand: {
      "@type": "Brand",
      name: product?.brand?.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: product?.boutique?.name,
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/boutiques/${product?.boutique?.slug}`,
    },
    color: product?.colors,
    size: product?.sizes,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Descriptors",
        value: product?.descriptors
          ?.map((s) => s?.descriptors?.map((s) => s?.value))
          .join(", "),
      },
      {
        "@type": "PropertyValue",
        name: "Similar Terms",
        value: product?.similar_words?.join(", "),
      },
      {
        "@type": "PropertyValue",
        name: "Labels",
        value: product?.labels?.join(", "),
      },
    ],
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product?.slug}`,
      priceCurrency: "USD",
      price: product?.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
};
