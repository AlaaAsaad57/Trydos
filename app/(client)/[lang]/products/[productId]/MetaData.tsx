import { generateCloudinaryUrl } from "utils/server";

const stripHtml = (html: string) => {
  if (html) {
    return html.replace(/<[^>]*>/g, "").trim();
  }
  return "";
};

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
