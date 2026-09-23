// The product page (server component) and its metadata.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../../mocks/nextNavigation";
import { cacheSpies } from "../../mocks/serverRequests";

const spies = vi.hoisted(() => ({
  GetProductMeta: vi.fn(),
  LogServerError: vi.fn(),
}));

vi.mock("next/root-params", () => ({ lang: async () => "sy-en" }));
vi.mock("serverRequests/product", () => ({ GetProductMeta: (...a: unknown[]) => spies.GetProductMeta(...a) }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: (...a: unknown[]) => spies.LogServerError(...a) }));
vi.mock("components/Product/ProductPageContent", () => ({ default: () => null }));

import ProductPageContent from "components/Product/ProductPageContent";
import Page, { generateMetadata } from "app/(client)/[lang]/products/[productId]/page";

const args = (searchParams: Record<string, unknown> | null = { color: "red" }) => ({
  params: Promise.resolve({ productId: "shoe" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  vi.clearAllMocks();
  spies.GetProductMeta.mockResolvedValue({ title: "Shoe" });
});

describe("the product page metadata", () => {
  it("returns the product metadata and caches it", async () => {
    const metadata = await generateMetadata(args());

    expect(metadata, "the product metadata was not returned").toEqual({ title: "Shoe" });
    expect(spies.GetProductMeta, "the metadata was not asked for this product and locale").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
      slug: "shoe",
      searchParams: { color: "red" },
    });
    expect(cacheSpies.RedisSet, "the metadata was not cached under the product and locale").toHaveBeenCalledWith(
      "shoe-sy-en",
      JSON.stringify({ title: "Shoe" }),
    );
  });

  it("returns empty metadata for a product that does not exist", async () => {
    spies.GetProductMeta.mockResolvedValue({ productNotFound: true });

    expect(await generateMetadata(args()), "a missing product did not get empty metadata").toEqual({});
    expect(cacheSpies.RedisSet, "a missing product was cached").not.toHaveBeenCalled();
  });

  it.each([
    ["an error answer", { error: "backend down" }],
    ["no answer", undefined],
  ])("returns empty metadata and reports for %s", async (_label, answer) => {
    spies.GetProductMeta.mockResolvedValue(answer);

    expect(await generateMetadata(args()), `${_label} did not get empty metadata`).toEqual({});
    expect(spies.LogServerError, `${_label} was not reported`).toHaveBeenCalled();
  });

  // The error is filed under the /featured page, copied from the listing
  // pages: a product metadata failure is reported against the wrong route.
  it("BUG-app-3: a product metadata failure is reported against the product route", async () => {
    spies.GetProductMeta.mockResolvedValue({ error: "backend down" });

    await generateMetadata(args());

    expect(spies.LogServerError.mock.calls[0][1], "the failure is not filed under the product route").toBe(
      "/sy-en/products/shoe",
    );
  });
});

describe("the product page", () => {
  it("renders the product content with the route and query", async () => {
    const tree: any = await Page(args());

    expect(tree.type, "the page did not render the product content").toBe(ProductPageContent);
    expect(tree.props, "the product content did not get the route and query").toEqual({
      params: { productId: "shoe" },
      searchParams: { color: "red" },
    });
  });

  it("still renders when the metadata read failed, with an empty query", async () => {
    spies.GetProductMeta.mockResolvedValue(undefined);

    const tree: any = await Page(args(null));

    expect(tree.props.searchParams, "a missing query was not replaced by an empty one").toEqual({});
    expect(spies.GetProductMeta.mock.calls[0][0].searchParams, "the metadata read did not get an empty query").toEqual({});
  });

  it("redirects home with a message when the product does not exist", async () => {
    spies.GetProductMeta.mockResolvedValue({ productNotFound: true });

    await expect(Page(args()), "a missing product did not redirect").rejects.toThrow();
    expect(navigationSpies.redirect, "a missing product went to the wrong place").toHaveBeenCalledWith(
      "/sy-en?message=product_not_found",
    );
  });
});
