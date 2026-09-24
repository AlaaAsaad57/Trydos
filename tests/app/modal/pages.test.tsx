// The two intercepted routes in the @modal slot: the filters overlay and the
// product overlay.
import { beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ GetProductMeta: vi.fn() }));

vi.mock("next/root-params", () => ({ lang: async () => "sy-en" }));
vi.mock("serverRequests/product", () => ({ GetProductMeta: (...a: unknown[]) => spies.GetProductMeta(...a) }));
vi.mock("components/Listing/FiltersPageContent", () => ({ default: () => null }));
vi.mock("components/Product/ProductPageContent", () => ({ default: () => null }));
vi.mock("components/global/NotFoundRedirect", () => ({ default: () => null }));

import FiltersPageContent from "components/Listing/FiltersPageContent";
import NotFoundRedirect from "components/global/NotFoundRedirect";
import ProductPageContent from "components/Product/ProductPageContent";
import InterceptedFiltersPage from "app/(client)/[lang]/@modal/(.)filters/[[...filters]]/page";
import InterceptedProductPage from "app/(client)/[lang]/@modal/(.)products/[productId]/page";

beforeEach(() => {
  vi.clearAllMocks();
  spies.GetProductMeta.mockResolvedValue({ title: "Shoe" });
});

describe("the filters overlay", () => {
  it("renders the filters content marked as intercepted, with the sort and search", async () => {
    const tree: any = await InterceptedFiltersPage({
      params: Promise.resolve({ filters: ["colors", "red"] }),
      searchParams: Promise.resolve({ sort: "new", search: "shoe" }),
    });

    expect(tree.type, "the overlay does not render the filters content").toBe(FiltersPageContent);
    expect(tree.props, "the overlay did not pass the filters, sort, search and intercepted flag").toEqual({
      params: { filters: ["colors", "red"] },
      sort: "new",
      search: "shoe",
      intercepted: true,
    });
  });

  it("passes no sort or search when there is no query", async () => {
    const tree: any = await InterceptedFiltersPage({ params: Promise.resolve({}), searchParams: Promise.resolve(null) });

    expect(tree.props.sort, "a missing sort was passed on").toBeUndefined();
    expect(tree.props.search, "a missing search was passed on").toBeUndefined();
  });
});

describe("the product overlay", () => {
  const args = (searchParams: Record<string, unknown> | null = { color: "red" }) => ({
    params: Promise.resolve({ productId: "shoe" }),
    searchParams: Promise.resolve(searchParams),
  });

  it("renders the product content after checking the product exists", async () => {
    const tree: any = await InterceptedProductPage(args());

    expect(spies.GetProductMeta, "the product was not checked in the locale").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
      slug: "shoe",
      searchParams: { color: "red" },
    });
    expect(tree.type, "the overlay does not render the product content").toBe(ProductPageContent);
    expect(tree.props.searchParams, "the query was not passed on").toEqual({ color: "red" });
  });

  it("uses an empty query when there is none", async () => {
    const tree: any = await InterceptedProductPage(args(null));

    expect(tree.props.searchParams, "a missing query was not replaced by an empty one").toEqual({});
  });

  it("hands a missing product to the client-side redirect", async () => {
    spies.GetProductMeta.mockResolvedValue({ productNotFound: true });

    const tree: any = await InterceptedProductPage(args());

    expect(tree.type, "a missing product did not render the client redirect").toBe(NotFoundRedirect);
    expect(tree.props.href, "the client redirect goes to the wrong place").toBe("/sy-en?message=product_not_found");
  });
});
