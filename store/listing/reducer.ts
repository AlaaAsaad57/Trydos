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

  resetEnd: () => set({ isReachEnd: false }),
});
