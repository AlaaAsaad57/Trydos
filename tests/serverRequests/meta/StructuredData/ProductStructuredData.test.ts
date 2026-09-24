// The product page's JSON-LD (serverRequests/meta/StructuredData/ProductStructuredData.tsx).
//
// Search engines read this block to show the product's name, price, stock and
// rating in results. Google refuses the block when the price is not a plain
// number, and penalises a rating that was made up, so both are checked by value.
//
// The component is called as a function and the JSON inside its <script> is read
// back. The translation barrel is replaced by the one pure helper it needs.
import { describe, expect, it, vi } from "vitest";

vi.mock("utils/server", async () => ({
  stripHtml: (await import("utils/server/helpers")).stripHtml,
}));

import ProductStructuredData from "serverRequests/meta/StructuredData/ProductStructuredData";

const SITE = "https://trydos.ramaaz.dev";

/** Render the block and read its JSON-LD back. */
function jsonLdOf(props: Record<string, any>) {
  const element: any = ProductStructuredData({
    local: "sy-en",
    currency: { decimal_digits: 0, exchange_rate: 1 },
    color: undefined,
    size: undefined,
    rating: undefined,
    reviewCount: undefined,
    ...props,
  } as any);
  return {
    element,
    graph: JSON.parse(element.props.dangerouslySetInnerHTML.__html)["@graph"],
  };
}

const product = {
  name: "Red dress",
  slug: "red-dress",
  details: "<p>A <b>long</b> red dress</p>",
  brand: { name: "Acme" },
  images: [{ file_path: "/a.jpg" }, "/b.jpg"],
  variations: [{ sku: "" }, { sku: "SKU-7" }],
  available_quantity: 3,
  offer_price: 12,
  price: 15,
  colors: [{ option: "red", name: "Red" }],
};

describe("the product JSON-LD", () => {
  it("describes the product, its price, stock, colour and real rating", () => {
    const { element, graph } = jsonLdOf({ product, color: "red", rating: 4.5, reviewCount: 8 });
    const [breadcrumbs, item] = graph;

    expect(element.props.id, "the script id is not tied to the product").toBe("product-red-dress-schema");
    expect(
      breadcrumbs.itemListElement.map((i: any) => i.item),
      "the breadcrumb trail is wrong",
    ).toEqual([`${SITE}/sy-en`, `${SITE}/sy-en/products/red-dress`]);
    expect(item, "the product block is wrong").toMatchObject({
      "@type": "Product",
      name: "Red dress",
      description: "A long red dress",
      url: `${SITE}/sy-en/products/red-dress`,
      brand: { "@type": "Brand", name: "Acme" },
      image: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      sku: "SKU-7",
      color: "Red",
      aggregateRating: { ratingValue: "4.5", reviewCount: "8" },
    });
    expect(item.offers, "the offer is wrong").toMatchObject({
      priceCurrency: "SYP",
      price: 12,
      availability: "https://schema.org/InStock",
    });
  });

  it("falls back to the category names, leaves out a made-up rating, and says out of stock", () => {
    const { graph } = jsonLdOf({
      product: {
        name: "Hat",
        slug: "hat",
        categories: [{ name: "Men" }, { name: "Hats" }],
        sku: "HAT-1",
        price: 5,
        colors: [{ option: "blue", name: "Blue" }],
      },
      local: "iq-ar",
      color: "red",
      rating: 5,
      reviewCount: 0,
    });
    const item = graph[1];

    expect(item.description, "a product with no text did not use its category names").toBe("Men-Hats");
    expect(item.sku, "the product's own sku was not used").toBe("HAT-1");
    expect(item.aggregateRating, "a rating with no reviews was published").toBeUndefined();
    expect(item.color, "a colour the product does not have was published").toBeUndefined();
    expect(item.offers.availability, "a product with no stock was not out of stock").toBe(
      "https://schema.org/OutOfStock",
    );
    expect(item.offers.priceCurrency, "the Iraqi currency is wrong").toBe("IQD");
  });

  it("publishes no sku and an empty description when the product has neither", () => {
    const { graph } = jsonLdOf({ product: { name: "Bare", slug: "bare" } });

    expect(graph[1].sku, "a sku was invented").toBeUndefined();
    expect(graph[1].description, "an empty product did not get an empty description").toBe("");
  });
});
