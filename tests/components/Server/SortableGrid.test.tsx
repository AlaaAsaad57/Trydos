// The grid controller for ?sort= and ?search=. While both match what the server
// rendered, the server grid stays. When either differs, a fresh client grid is
// paged from page 1. While a filter change is on its way, skeletons show.
import { describe, expect, it, vi } from "vitest";

const infiniteScroll = vi.fn();

vi.mock("components/ListingPage/ProductInfiniteScroll", () => ({
  default: (props: any) => {
    infiniteScroll(props);
    return <div data-pw="client-grid" />;
  },
}));

import SortableGrid from "components/Server/SortableGrid";

import { renderWithProviders, screen } from "../../render";

const spies = () => ({
  setIsNavigating: vi.fn(),
  setListingSearchLoading: vi.fn(),
  setSearchHasResults: vi.fn(),
  setSearchHasMultipleResults: vi.fn(),
});

describe("the sortable grid", () => {
  it("keeps the server grid and restores the server's verdicts when the address matches", async () => {
    const store = spies();
    await renderWithProviders(
      <SortableGrid currency={null} parsedFilters={{}} serverHasResults={false} serverHasMultipleResults={false}>
        <div>server grid</div>
      </SortableGrid>,
      { store },
    );
    expect(screen.getByText("server grid"), "the server grid should stay when nothing changed").toBeInTheDocument();
    expect(store.setIsNavigating, "the page loader should be cleared").toHaveBeenCalledWith(null);
    expect(store.setListingSearchLoading, "the search spinner should stop").toHaveBeenCalledWith(false);
    expect(store.setSearchHasResults, "the server's has-results verdict should be restored").toHaveBeenCalledWith(false);
    expect(store.setSearchHasMultipleResults, "the server's several-results verdict should be restored").toHaveBeenCalledWith(false);
  });

  it("shows product skeletons while a filter change is on its way", async () => {
    const { container } = await renderWithProviders(
      <SortableGrid currency={null} parsedFilters={{}}>
        <div>server grid</div>
      </SortableGrid>,
      { store: { ...spies(), isNavigating: { is_filter: true } } },
    );
    expect(screen.queryByText("server grid"), "the old grid should be replaced while filters load").toBeNull();
    expect(container.children.length, "skeleton cards should fill the grid").toBeGreaterThan(0);
  });

  it("pages a fresh sorted grid, with a skeleton, when the sort changed", async () => {
    infiniteScroll.mockClear();
    await renderWithProviders(
      <SortableGrid currency={null} parsedFilters={{ brands: ["b"] }} serverSort="">
        <div>server grid</div>
      </SortableGrid>,
      { store: spies(), search: "sort=price" },
    );
    expect(infiniteScroll, "a changed sort should re-page from page 1 with a skeleton").toHaveBeenCalledWith(
      expect.objectContaining({ sort: "price", searchMode: false, firstPageSkeleton: true, parsedFilters: { brands: ["b"] } }),
    );
  });

  it("pages a fresh search grid, without a skeleton, when the search changed", async () => {
    infiniteScroll.mockClear();
    await renderWithProviders(
      <SortableGrid currency={null} parsedFilters={{}} serverSearch="old">
        <div>server grid</div>
      </SortableGrid>,
      { store: spies(), search: "search=new" },
    );
    expect(infiniteScroll, "a changed search should merge the raw query and skip the skeleton").toHaveBeenCalledWith(
      expect.objectContaining({ searchMode: true, searchQuery: "new", firstPageSkeleton: false, parsedFilters: { search_text: "new" } }),
    );
  });

  it("drops the search text when the shopper cleared the search", async () => {
    infiniteScroll.mockClear();
    await renderWithProviders(
      <SortableGrid currency={null} parsedFilters={{ search_text: "old" }} serverSearch="old">
        <div>server grid</div>
      </SortableGrid>,
      { store: spies() },
    );
    expect(
      infiniteScroll.mock.calls.at(-1)[0].parsedFilters.search_text,
      "a cleared search must not keep the old text",
    ).toBeUndefined();
  });
});
