// The listing's search box, server side. It picks which search text the box
// starts with: the ?search= value first, then what the backend says it applied,
// then the search in the path.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/filterPage/SearchBoutiquePage", () => ({
  default: () => null,
}));

import ListingSearchContainer from "components/Server/ListingSearchContainer";

const searchText = async (args: Record<string, any>) => {
  const element: any = await ListingSearchContainer({
    country: "sy",
    language: "en",
    parsedFilters: {},
    filtersPromise: Promise.resolve({}),
    ...args,
  } as any);
  return element.props.children.props;
};

describe("the listing search box (server side)", () => {
  it("starts from the ?search= value when there is one", async () => {
    const box = await searchText({
      serverSearch: "query",
      filtersPromise: Promise.resolve({ applied: { search_text: "applied" } }),
    });
    expect(box.serverSearch, "the ?search= value should win").toBe("query");
    expect(box.featured, "featured should default to false").toBe(false);
    expect(box.flashdeal, "flash deal should default to false").toBe(false);
  });

  it("falls back to the search the backend applied", async () => {
    const box = await searchText({
      filtersPromise: Promise.resolve({ applied: { search_text: "applied" } }),
      parsedFilters: { search_text: ["path"] },
    });
    expect(box.serverSearch, "the applied search should be used when there is no ?search=").toBe("applied");
  });

  it("falls back to the search in the path, then to nothing", async () => {
    expect(
      (await searchText({ parsedFilters: { search_text: ["path"] }, featured: true, flashdeal: true })).serverSearch,
      "the path search should be used last",
    ).toBe("path");
    expect(
      (await searchText({ filtersPromise: Promise.resolve(null) })).serverSearch,
      "no search anywhere should give an empty box",
    ).toBe("");
  });
});
