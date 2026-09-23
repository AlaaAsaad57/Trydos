import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Listing store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      listing_loading: true,
      isReachEnd: false,
      offset: null,
      filterEnabled: false,
      skeleton: false,
      showedFilter: "Categories",
      searchLoading: false,
      searchHasResults: true,
      searchHasMultipleResults: true,
      searchExpanded: false,
    });
  });

  it("setLoadingProducts updates listing_loading flag", () => {
    useAppStore.getState().setLoadingProducts(false);
    expect(useAppStore.getState().listing_loading, "listing_loading should be false").toBe(false);
  });

  it("setShowedFilter updates active filter tab name", () => {
    useAppStore.getState().setShowedFilter("Brands");
    expect(useAppStore.getState().showedFilter, "showedFilter should be 'Brands'").toBe("Brands");
  });

  it("setListingSearchLoading & setSearchExpanded update search UI state", () => {
    useAppStore.getState().setListingSearchLoading(true);
    useAppStore.getState().setSearchExpanded(true);

    expect(useAppStore.getState().searchLoading, "searchLoading should be true").toBe(true);
    expect(useAppStore.getState().searchExpanded, "searchExpanded should be true").toBe(true);
  });

  it("resetListingFilter resets pagination offset to 1 and isReachEnd to false", () => {
    useAppStore.setState({ offset: 10, isReachEnd: true, listing_loading: true });
    useAppStore.getState().resetListingFilter();

    expect(useAppStore.getState().offset, "offset should be reset to 1").toBe(1);
    expect(useAppStore.getState().isReachEnd, "isReachEnd should be reset to false").toBe(false);
    expect(useAppStore.getState().listing_loading, "listing_loading should be false").toBe(false);
  });
});

describe("Listing store — filter bar and search result flags", () => {
  it("setFilterEnabled scrolls the filter bar back to the start", () => {
    const bar = document.createElement("div");
    bar.className = "filter-container";
    bar.scrollLeft = 120;
    document.body.appendChild(bar);
    useAppStore.getState().setFilterEnabled(true);
    expect(bar.scrollLeft, "the filter bar was not scrolled back").toBe(0);
    expect(useAppStore.getState().filterEnabled, "the filter flag was not set").toBe(true);
    bar.remove();
    useAppStore.getState().setFilterEnabled(false);
    expect(useAppStore.getState().filterEnabled, "the flag failed with no filter bar on the page").toBe(false);
  });

  it("resetBoutique and the search result flags write their state", () => {
    useAppStore.setState({ isReachEnd: true, offset: 5 } as any);
    useAppStore.getState().resetBoutique();
    useAppStore.getState().setSearchHasResults(false);
    useAppStore.getState().setSearchHasMultipleResults(false);
    const s = useAppStore.getState();
    expect([s.isReachEnd, s.offset, s.searchHasResults, s.searchHasMultipleResults], "the listing flags are wrong").toEqual([
      false,
      null,
      false,
      false,
    ]);
  });
});
