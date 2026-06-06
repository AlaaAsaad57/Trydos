import { General_Site_Data } from "./Constants";
import { GetImageUrl, RoundPrice } from "utils/server";
import { mapCurrencyToSymbol } from "./utils";

function ListingBreadcrumbList({ local, target, title, products, currency }) {
  const [country, language] = local.split("-");
  let payload = {
    "@context": "https://schema.org",
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
            name: title.join(" - "),
            item: `${General_Site_Data.url}/${local}${target}`,
          },
        ],
      },
      {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products?.map((product, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: product?.name,
            url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
            image: GetImageUrl(
              product?.images?.[0]?.file_path ??
                product?.images?.[0] ??
                product?.sync_color_images?.[0]?.images?.[0]?.file_path ??
                product?.sync_color_images?.[0]?.images?.[0],
            ),
            offers: {
              "@type": "Offer",
              // schema.org price must be a plain number (no K/M abbreviation,
              // grouping, or currency symbols) — returnNumber bypasses RoundPrice's
              // display formatting. See Google "Invalid price format" SDTT error.
              price: RoundPrice({
                num: product?.offer_price ?? product?.price,
                language: language,
                points: currency?.decimal_digits,
                rate: currency?.exchange_rate,
                returnNumber: true,
              }),
              priceCurrency: mapCurrencyToSymbol(country),
            },
          },
        })),
      },
    ],
  };

  return (
    <script
      id="items-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default ListingBreadcrumbList;
