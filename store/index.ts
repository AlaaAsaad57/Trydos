import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "./auth/reducer";
import { useDetailsStore } from "./Details/reducer";
import { useHomeStore } from "./homepage/reducer";
import { useListingStore } from "./listing/reducer";
import { useSearchStore } from "./search/reducer";
import { useChatStore } from "./chat/reducer";
import useCartStore from "./Cart/reducer";
import { useNotificationStore } from "./notifications/reducer";

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
    cameraPermissions: boolean;
    setCameraPermissions: (value: boolean) => void;
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
      cameraPermissions: false,
      setCameraPermissions: (value: boolean) => set({ cameraPermissions: value }),
      checkCameraPermissions: async () => {
        try {
          // Try to get both camera and microphone permissions
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          set({ cameraPermissions: true });
        } catch (e) {
          set({ cameraPermissions: false });
        }
      },
      _hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => {
        set({
          _hasHydrated: hasHydrated,
        });
      },
    }),
    {
      name: "app-store", // for devtools
    }
  )
);

// Hydration helper
export const useHydratedStore = () => {
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  const store = useAppStore();

  // Return store methods only after hydration
  if (!hasHydrated) {
    // Return safe defaults during SSR/before hydration
    return {
      ...store,
      storiesData: [],
      setStoryData: () => {},
      // Add other methods that need safe defaults
    };
  }

  return store;
};
