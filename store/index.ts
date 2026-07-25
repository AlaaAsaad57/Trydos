import { create } from "zustand";

import { useAuthStore } from "./auth/reducer";
import { useCommentsStore } from "./comments/reducer";
import { useDetailsStore } from "./Details/reducer";
import { useHomeStore } from "./homepage/reducer";
import { useListingStore } from "./listing/reducer";
import { useSearchStore } from "./search/reducer";
import { useChatStore } from "./chat/reducer";
import useCartStore from "./Cart/reducer";
import { useLuckStore } from "./luck/reducer";
import { devtools } from "zustand/middleware";

// Only enable devtools in development
const withDevtools =
  process.env.NODE_ENV === "development"
    ? (fn: any) => devtools(fn, { name: "MainAppStore" })
    : (fn: any) => fn;

/** Settled GET /shop/info outcome for one shop. See the field notes below. */
export type DashboardShopInfo = {
  sellerId: string;
  currency: { code: string; name: string };
  /** false ONLY when the backend explicitly says so; absent field => true. */
  newProductsApproval: boolean;
  /** false when the request did not succeed — the standing is unknown. */
  available: boolean;
};

// Create a type that combines all store states
type AppState = ReturnType<typeof useAuthStore> &
  ReturnType<typeof useCartStore> &
  ReturnType<typeof useChatStore> &
  ReturnType<typeof useCommentsStore> &
  ReturnType<typeof useDetailsStore> &
  ReturnType<typeof useHomeStore> &
  ReturnType<typeof useListingStore> &
  ReturnType<typeof useSearchStore> &
  ReturnType<typeof useLuckStore> & {
    _hasHydrated: boolean;
    setHasHydrated: (hasHydrated: boolean) => void;
    cameraPermissions: any;
    setCameraPermissions: (value: any) => void;
    checkCameraPermissions: () => Promise<void>;
    sellerOrders: any[];
    setSellerOrders: (orders: any[] | ((prev: any[]) => any[])) => void;
    // Seller-dashboard shop info (GET /shop/info), keyed by sellerId so a
    // shop switch never shows a stale currency.
    //
    // The record is a SETTLED outcome for exactly one sellerId — null means
    // "not resolved yet", never "failed". `available` distinguishes the two:
    //   available: false -> the request did not succeed; the standing is UNKNOWN
    //   available: true  -> the response was read; newProductsApproval is usable
    // `currency` is always present (`{ code: "", name: "" }` when unavailable) so
    // consumers reading `currency.code` need no null handling.
    // `newProductsApproval` is false ONLY when the backend explicitly says so; an
    // absent field means the backend does not gate this seller, never a restriction.
    dashboardShopInfo: DashboardShopInfo | null;
    setDashboardShopInfo: (info: DashboardShopInfo | null) => void;
  };

// Create the combined store with hydration support
export const useAppStore = create<AppState>()(
  withDevtools(
    (set, get) => ({
      ...useAuthStore(set, get),
      ...useChatStore(set, get),
      ...useCommentsStore(set, get),
      ...useDetailsStore(set, get),
      ...useHomeStore(set, get),
      ...useListingStore(set, get),
      ...useSearchStore(set, get),
      ...useCartStore(set, get),
      ...useLuckStore(set, get),

      dashboardShopInfo: null,
      setDashboardShopInfo: (value: DashboardShopInfo | null) =>
        set({ dashboardShopInfo: value }, false, "setDashboardShopInfo"),

      cameraPermissions: "asked",
      setCameraPermissions: (value: any) => set({ cameraPermissions: value }),
      checkCameraPermissions: async () => {
        try {
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          set(
            { cameraPermissions: "granted" },
            false,
            "checkCameraPermissions/granted"
          );
        } catch (e) {
          set(
            { cameraPermissions: "revoked" },
            false,
            "checkCameraPermissions/revoked"
          );
          throw new Error("");
        }
      },
      _hasHydrated: false,
      setHasHydrated: (state: boolean) =>
        set({ _hasHydrated: state }, false, "setHasHydrated"),
    })
  )
);

// Hydration helper
