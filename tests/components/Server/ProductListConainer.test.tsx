// The listing's product grid container (server side). It picks the search text
// that later pages keep using, and hands the first page to the grid.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/Server/ProductList", () => ({ default: () => null }));
vi.mock("serverRequests/meta/StructuredData/ListingBreadcrumbList", () => ({
  default: () => null,
}));
vi.mock("serverRequests/meta/StructuredData/utils", () => ({
  getTitleAndTargetofListing: () => ({ path: "/p", title: "T" }),
}));
vi.mock("utils/listing/normalizeListingProduct", () => ({
  normalizeListingProduct: (p: any) => ({ ...p, normalized: true }),
}));

import ProductListConainer from "components/Server/ProductListConainer";

const gridProps = async (args: Record<string, any>) => {
  const element: any = await ProductListConainer({
    currencyPromise: Promise.resolve({ symbol: "$" }),
    boutiquePromise: Promise.resolve({ name: "Nike" }),
    parsedFilters: { search_text: ["path"] },
    Params: { lang: "sy-en" },
    language: "en",
    ...args,
  } as any);
  const [breadcrumb, grid] = element.props.children;
  return { breadcrumb: breadcrumb.props, grid: grid.props };
};

describe("the listing grid container", () => {
  it("keeps the analysed search name for later pages and hands the first page to the grid", async () => {
    const { grid, breadcrumb } = await gridProps({
      filtersDataPromise: Promise.resolve({
        products: [{ id: 1 }],
        isAnalyzed: { name: "red shoe" },
        offset: 20,
        pit_id: "pit",
        recommended_offset: 3,
      }),
      serverSearch: "red shoes",
      sort: "price",
    });
    expect(grid.parsedFilters.search_text, "the analysed name should win so pages stay consistent").toBe("red shoe");
    expect(grid.products, "products should be normalised before the grid gets them").toEqual([{ id: 1, normalized: true }]);
    expect(grid.boutique, "the boutique name should reach the grid").toBe("Nike");
    expect(grid.pit_id, "the search session id should reach the grid").toBe("pit");
    expect(grid.sort, "the sort should reach the grid").toBe("price");
    expect(breadcrumb.title, "the breadcrumb should get the listing title").toBe("T");
  });

  it("falls back to the raw ?search=, then to the path search", async () => {
    const withSearch = await gridProps({
      filtersDataPromise: Promise.resolve({ products: [] }),
      serverSearch: "shoe",
    });
    expect(withSearch.grid.parsedFilters.search_text, "a one-word ?search= should be kept for later pages").toBe("shoe");
    expect(withSearch.grid.pit_id, "no search session id should be passed as null").toBeNull();

    const fromPath = await gridProps({ filtersDataPromise: Promise.resolve({ products: [] }) });
    expect(fromPath.grid.parsedFilters.search_text, "the path search should be the last resort").toBe("path");
  });
});
