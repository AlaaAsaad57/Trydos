// components/BoutiqueHead.tsx

import { Metadata } from "next";
import { fetchServerData } from "Server Requests/ServerFetch";
import { generateCloudinaryUrl } from "utils/tinyUtils";
const stripHtml = (html: string) => {
  if (html) {
    return html.replace(/<[^>]*>/g, "").trim();
  }
  return "";
};
export async function generateProductMetaData({
  params,
  searchParams,
}): Promise<Metadata> {
  try {
    const [country, language] = params.lang.split("-");
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/product-meta/${params.productId}?lang=${language}`,
      method: "GET",
      local: `${country}-${language}`,
      revalidate: 3600,
      tags: ["product-meta", params.productId],
    });
    console.log(response);
    const getProductMetaData = response.data;
    if (response.error) {
      throw new Error(response.error);
    }
    let product = response.data;

    let title = `${product?.name}`;
    if (searchParams.color) {
      title += ` |  ${searchParams.color}`;
    }
    if (searchParams.size) {
      title += ` |  ${searchParams.size}`;
    }
    let image = product?.images
      ? generateCloudinaryUrl({
          publicIds: product?.images.map((s) => `${s.images}`),
          width: 1200,
          height: 630,
        })
      : null;
    let data: Metadata = {
      title: title,
      description: stripHtml(product?.details),
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${params.productId}`,
        languages: {
          en: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en/products/${params.productId}`,
          tr: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-tr/products/${params.productId}`,
          ar: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-ar/products/${params.productId}`,
        },
      },
      openGraph: {
        title: title,
        description: stripHtml(product?.details),
        url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${params.productId}`,
        siteName: "Trydos",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: "",
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: stripHtml(product?.details),
        images: [image],
      },
      keywords: [
        product?.name,
        product?.brand,
        product?.category,
        product?.boutique,
        ...(product?.similar_words || []),
      ],
    };

    return data;
  } catch (error) {
    console.log(error, "error");
    return {
      title: "!Not Found Product MetaData",
      // @ts-ignore
      error: "!Not Found Product MetaData",
      description: "!Not Found Product MetaData",
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
        publicIds: product?.images.map((s) => `${s.images}`),
        width: 1200,
        height: 630,
      })
    : null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.name,
    image: image,
    description: stripHtml(product?.details),
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
