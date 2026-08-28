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
