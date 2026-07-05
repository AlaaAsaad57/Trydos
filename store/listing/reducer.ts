import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ListingState {
  listing_loading: boolean;
  isReachEnd: boolean;
  offset: number | null;
  filterEnabled: boolean;
  skeleton: boolean;
  showedFilter: string;
  limit: number;
  cameraPermissions: "asked";
  // Search UI coordination (listing search → ?search= refactor).
  searchLoading: boolean; // in-input spinner: typing → results landed
  searchHasResults: boolean; // reactive sort/filter/share empty-gate + grid empty-state
  searchExpanded: boolean; // collapse/expand of the search box + hide boutique logo
}

const initialState: ListingState = {
  listing_loading: true,
  isReachEnd: false,
  offset: null,
  filterEnabled: false,
  skeleton: false,
  showedFilter: "Categories",
  limit: 4,
  cameraPermissions: "asked",
  searchLoading: false,
  searchHasResults: true,
  searchExpanded: false,
};

export const useListingStore = (set, get) => ({
  ...initialState,

  setShowedFilter: (filter: string) => set({ showedFilter: filter }),

  setFilterEnabled: (enabled: boolean) => {
    const filterContainer = document.querySelector(".filter-container");
    if (filterContainer) {
      filterContainer.scrollLeft = 0;
    }
    set({ filterEnabled: enabled });
  },

  setSkeleton: (show: boolean) => set({ skeleton: show }),

  setLoadingProducts: (loading: boolean) => set({ listing_loading: loading }),

  resetBoutique: () => set({ isReachEnd: false, offset: null }),

  resetListingFilter: () =>
    set({ offset: 1, isReachEnd: false, listing_loading: false }),

  setSearchLoading: (loading: boolean) => set({ searchLoading: loading }),

  setSearchHasResults: (hasResults: boolean) =>
    set({ searchHasResults: hasResults }),

  setSearchExpanded: (expanded: boolean) => set({ searchExpanded: expanded }),

  resetEnd: () => set({ isReachEnd: false }),
});
