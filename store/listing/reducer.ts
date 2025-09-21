import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Product {
  id: string | number;
  product_id: string | number;
  [key: string]: any;
}

interface ListingState {
  products: Product[];
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
  products: [],
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

  getProducts: (payload: { products?: Product[]; offset?: number }) =>
    set((state) => ({
      products:
        payload?.products?.map((s) => ({ ...s, id: s.product_id })) ?? [],
      offset: payload?.offset ?? state.offset,
      listing_loading: false,
      skeleton: false,
    })),

  setSkeleton: (show: boolean) => set({ skeleton: show }),

  setLoadingProducts: (loading: boolean) => set({ listing_loading: loading }),

  getNextProducts: (payload: { products?: any[]; offset?: any }) =>
    set((state) => {
      const newProducts =
        payload?.products?.map((s) => ({ ...s, id: s.product_id })) ?? [];
      const uniqueProducts = newProducts.filter(
        (s) => state.products.filter((d) => d.id === s.id).length === 0
      );

      return {
        products: [...state.products, ...uniqueProducts],
        offset: payload.offset ?? state.offset,
        isReachEnd: payload.products?.length === 0,
        listing_loading: false,
      };
    }),

  resetBoutique: () => set({ isReachEnd: false, offset: null }),

  resetListingFilter: () =>
    set({ offset: 1, isReachEnd: false, listing_loading: false }),

  resetEnd: () => set({ isReachEnd: false }),
});
