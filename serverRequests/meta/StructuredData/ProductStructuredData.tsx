import Script from "next/script";
import { General_Site_Data } from "./Constants";
import { GetImageUrl } from "utils/tinyUtils";
import { mapCurrencyToSymbol } from "./utils";
import { RoundPrice } from "utils/functions";
import { stripHtml } from "utils/server";

function ProductStructuredData({
  product,
  local,
  currency,
  color,
  size,
  rating,
  reviewCount,
}) {
  const [country, language] = local.split("-");

  // Real product description (HTML stripped). Fall back to category names only when
  // the product has no description text.
  const description =
    stripHtml(product?.details ?? product?.description ?? "") ||
    `${product?.categories?.map((s) => s.name).join("-") ?? ""}`;

  const sku =
    product?.variations?.find((v) => v?.sku)?.sku ?? product?.sku ?? undefined;
  const inStock = (product?.available_quantity ?? 0) > 0;

  let payload: any = {
    // "@type": "ProductGroup",
    "@type": "Product",
    name: product?.name,
    // variesBy: ["https://schema.org/size"],
    description,
    url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
    brand: {
      "@type": "Brand",
      name: product?.brand?.name,
    },
    image: product?.images?.map((im) => GetImageUrl(im?.file_path ?? im)),
  };

  if (sku) payload.sku = sku;

  // Only emit aggregateRating with REAL data — never fabricate ratings (Google policy).
  if (Number(reviewCount) > 0 && Number(rating) > 0) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(rating),
      reviewCount: String(reviewCount),
    };
  }
  if (color && product?.colors?.find((s) => s.option === color)?.name) {
    payload = {
      ...payload,
      color: product?.colors?.find((s) => s.option === color)?.name,
    };
  }

  payload = {
    ...payload,
    offers: {
      "@type": "Offer",
      priceCurrency: mapCurrencyToSymbol(country),
      url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
      price: RoundPrice({
        num: product?.offer_price ?? product?.price,
        language: language,
        points: currency.decimal_digits,
        rate: currency.exchange_rate,
      }),
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  let jsonLd: any = {
    "@context": "https://schema.org/",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${General_Site_Data.url}/${local}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: `${General_Site_Data.url}/${local}/products/${product.slug}`,
          },
        ],
      },
      payload,
    ],
  };

  return (
    <Script
      id={`product-${product.slug}-schema`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default ProductStructuredData;
