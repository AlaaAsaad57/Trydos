// The listing page's JSON-LD (serverRequests/meta/StructuredData/ListingBreadcrumbList.tsx):
// a breadcrumb trail and the list of products on the page, each with a plain
// number price (Google refuses a formatted one). The component is called as a
// function and the JSON in its <script> is read back. The translation barrel is
// replaced by the two pure helpers it needs.
import { describe, expect, it, vi } from "vitest";

vi.mock("utils/server", async () => {
  const helpers = await import("utils/server/helpers");
  return { GetImageUrl: helpers.GetImageUrl, RoundPrice: helpers.RoundPrice };
});

import ListingBreadcrumbList from "serverRequests/meta/StructuredData/ListingBreadcrumbList";

const SITE = "https://trydos.ramaaz.dev";

describe("the listing JSON-LD", () => {
  it("lists the breadcrumbs and every product with its picture and plain price", () => {
    const element: any = ListingBreadcrumbList({
      local: "sy-en",
      target: "/filters/brands/acme",
      title: ["Trydos", "Acme"],
      currency: { decimal_digits: 0, exchange_rate: 1 },
      products: [
        { name: "Hat", slug: "hat", images: [{ file_path: "/h.jpg" }], offer_price: 5 },
        { name: "Cap", slug: "cap", images: ["/c.jpg"], price: 7 },
        { name: "Bag", slug: "bag", sync_color_images: [{ images: [{ file_path: "/b.jpg" }] }], price: 9 },
        { name: "Box", slug: "box", sync_color_images: [{ images: ["/x.jpg"] }], price: 1 },
      ],
    });
    const [breadcrumbs, list] = JSON.parse(element.props.dangerouslySetInnerHTML.__html)["@graph"];

    expect(breadcrumbs.itemListElement[1], "the listing breadcrumb is wrong").toMatchObject({
      name: "Trydos - Acme",
      item: `${SITE}/sy-en/filters/brands/acme`,
    });
    expect(list.numberOfItems, "the product count is wrong").toBe(4);
    expect(
      list.itemListElement.map((i: any) => i.item.image),
      "a product's picture was not found in any of its picture fields",
    ).toEqual([
      "https://example.com/h.jpg",
      "https://example.com/c.jpg",
      "https://example.com/b.jpg",
      "https://example.com/x.jpg",
    ]);
    expect(list.itemListElement[0].item.offers, "the offer is wrong").toEqual({
      "@type": "Offer",
      price: 5,
      priceCurrency: "SYP",
    });
  });
});
