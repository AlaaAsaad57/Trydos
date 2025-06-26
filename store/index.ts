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
  ReturnType<typeof useSearchStore>;

// Create the combined store
export const useAppStore = create<AppState>()((set, get) => ({
  ...useAuthStore(set, get),
  ...useChatStore(set, get),
  ...useDetailsStore(set, get),
  ...useHomeStore(set, get),
  ...useListingStore(set, get),
  ...useSearchStore(set, get),
  ...useCartStore(set, get),
}));
