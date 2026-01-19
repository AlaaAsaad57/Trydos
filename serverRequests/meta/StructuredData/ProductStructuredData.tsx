import Script from "next/script";
import { General_Site_Data } from "./Constants";
import { GetImageUrl } from "utils/tinyUtils";
import { mapCurrencyToSymbol } from "./utils";
import { RoundPrice } from "utils/server";

function ProductStructuredData({ product, local, currency, color, size }) {
  const [country, language] = local.split("-");
  let payload: any = {
    // "@type": "ProductGroup",
    "@type": "Product",
    name: product?.name,
    // variesBy: ["https://schema.org/size"],
    description: `${product?.categories?.map((s) => s.name).join("-")}`,
    url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
    brand: {
      "@type": "Brand",
      name: product?.brand?.name,
    },
    image: product?.images?.map((im) => GetImageUrl(im?.file_path ?? im)),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.94",
      reviewCount: "500",
    },
  };
  if (color && product?.colors?.find((s) => s.option === color)?.name) {
    payload = {
      ...payload,
      color: product?.colors?.find((s) => s.option === color)?.name,
    };
  }
  // if (product?.variation?.length) {
  //   payload = {
  //     ...payload,
  //     hasVariant: product?.variation.map((variant) => ({
  //       "@type": "Product",
  //       sku: variant?.sku,
  //       name: `${product?.name} - ${variant?.type}`,
  //       image: product?.images?.[0]?.file_path ?? product?.images?.[0],
  //       offers: {
  //         "@type": "Offer",
  //         priceCurrency: mapCurrencyToSymbol(country),
  //         url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
  //         price: RoundPrice({
  //           num: variant?.offer_price ?? variant?.price,
  //           language: language,
  //           points: currency.decimal_digits,
  //           rate: currency.exchange_rate,
  //         }),
  //         itemCondition: "https://schema.org/NewCondition",
  //         availability: "https://schema.org/InStock",
  //       },
  //     })),
  //   };
  // } else {

  // }
  //
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
      availability: "https://schema.org/InStock",
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
            item: `${General_Site_Data.url}/${local}/${product.slug}`,
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
