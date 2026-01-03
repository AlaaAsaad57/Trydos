import { create } from "zustand";

import { useAuthStore } from "./auth/reducer";
import { useDetailsStore } from "./Details/reducer";
import { useHomeStore } from "./homepage/reducer";
import { useListingStore } from "./listing/reducer";
import { useSearchStore } from "./search/reducer";
import { useChatStore } from "./chat/reducer";
import useCartStore from "./Cart/reducer";
import { devtools } from "zustand/middleware";

// Create a type that combines all store states
type AppState = ReturnType<typeof useAuthStore> &
  ReturnType<typeof useCartStore> &
  ReturnType<typeof useChatStore> &
  ReturnType<typeof useDetailsStore> &
  ReturnType<typeof useHomeStore> &
  ReturnType<typeof useListingStore> &
  ReturnType<typeof useSearchStore> & {
    _hasHydrated: boolean;
    setHasHydrated: (hasHydrated: boolean) => void;
    cameraPermissions: any;
    setCameraPermissions: (value: any) => void;
    checkCameraPermissions: () => Promise<void>;
  };

// Create the combined store with hydration support
export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      ...useAuthStore(set, get),
      ...useChatStore(set, get),
      ...useDetailsStore(set, get),
      ...useHomeStore(set, get),
      ...useListingStore(set, get),
      ...useSearchStore(set, get),
      ...useCartStore(set, get),

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
    }),
    { name: "MainAppStore" } // This names the store in DevTools
  )
);

// Hydration helper
