// "You May Also Like" on the product page.
import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const { GetRelatedProducts, seen } = vi.hoisted(() => ({
  GetRelatedProducts: vi.fn(),
  seen: { cards: [] as any[], scroll: null as any },
}));
vi.mock("serverRequests/listing", () => ({
  GetRelatedProducts: (...a: any[]) => GetRelatedProducts(...a),
}));
vi.mock("utils/server", () => ({ translateFunction: (key: string) => key }));
vi.mock("components/products/ProductCard", () => ({
  default: (p: any) => {
    seen.cards.push(p);
    return null;
  },
}));
vi.mock("components/Product/RelatedProductsInfiniteScroll", () => ({
  default: (p: any) => {
    seen.scroll = p;
    return null;
  },
}));

import RelatedProductsSection from "components/Server/product/RelatedProductsSection";

const run = (product: any, language = "en") =>
  RelatedProductsSection({
    globalPromise: Promise.resolve(product),
    language,
    country: "sy",
    currency: Promise.resolve({ symbol: "$" }),
  });

describe("the related products section", () => {
  it("shows nothing for a product without an id", async () => {
    GetRelatedProducts.mockClear();
    expect(await run({}), "no id means nothing to relate to").toBeNull();
    expect(GetRelatedProducts, "no request should be made without an id").not.toHaveBeenCalled();
  });

  it("shows nothing when the backend has no related products", async () => {
    GetRelatedProducts.mockResolvedValueOnce(null);
    expect(await run({ id: 1 }), "no answer should show nothing").toBeNull();
    GetRelatedProducts.mockResolvedValueOnce({ products: [] });
    expect(await run({ id: 1 }), "an empty list should show nothing").toBeNull();
  });

  it("draws the first page and hands the paging state to the scroll, right to left in Arabic", async () => {
    seen.cards = [];
    GetRelatedProducts.mockResolvedValue({
      products: [{ product_id: 2 }, { slug: "s" }],
      offset: [5],
      productIds: ["2"],
      pit_id: "p",
    });
    const { container, getByText } = render(await run({ id: 1 }, "ar"));
    expect(getByText("You May Also Like"), "the section title is missing").toBeInTheDocument();
    expect(seen.cards.length, "each related product should get a card").toBe(2);
    expect(seen.scroll, "the scroll should continue from the first page").toEqual(
      expect.objectContaining({
        productId: 1,
        offset: [5],
        initialProductIds: ["2"],
        pit_id: "p",
        currency: { symbol: "$" },
      }),
    );
    expect(
      (container.firstElementChild as HTMLElement).className,
      "the section should align right in Arabic",
    ).toContain("items-end");
  });

  it("passes empty paging ids when the backend gives none", async () => {
    GetRelatedProducts.mockResolvedValue({ products: [{ product_id: 2 }], offset: [] });
    render(await run({ id: 1 }));
    expect(seen.scroll.initialProductIds, "missing ids should be an empty list").toEqual([]);
    expect(seen.scroll.pit_id, "a missing snapshot id should be null").toBeNull();
  });
});
