import StoryServiceClass from "services/story";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

// crypto.randomUUID is unavailable in non-secure contexts (e.g. LAN-IP dev over
// http), and this runs at module scope — a throw here would break the store.
const newSessionId = (): string => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `s_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
};

interface Story {
  id: string | number;
  stories: Array<{
    id: string | number;
    is_seen: boolean;
  }>;
}

interface Settings {
  data: any;
}

interface HomeState {
  language: string;
  country: string;
  loading: boolean;
  loadingStories: boolean;
  selectedStory: any | null;
  renderStories: boolean;
  OpenCamera: boolean;
  addStoryEnable: boolean;
  storiesData: Story[] | null;
  storiesRefreshing: boolean;
  categories: any[];
  settings: Settings | null;
  loginOpen: boolean;
  boutiques: any[];
  session_id: string;
  previous_event_button_name: string | null;
  activeRoute: string;
  showMessage: boolean;
  currency: any | null;
  cod_cost: number | null;
  countries: any[];
  isRegisteringReady: boolean;
  isNavigating: any;
  isProductPage: boolean;
}

const initialState: HomeState = {
  language: "en",
  country: "",
  loading: false,
  addStoryEnable: false,
  cod_cost: 0,
  loadingStories: true,
  selectedStory: null,
  renderStories: false,
  OpenCamera: false,
  storiesData: [],
  storiesRefreshing: false,
  categories: [],
  settings: null,
  loginOpen: false,
  boutiques: [],
  session_id: newSessionId(),
  previous_event_button_name: null,
  activeRoute: null,
  showMessage: false,
  currency: null,
  countries: [],
  isRegisteringReady: true,
  isNavigating: false,
  isProductPage: false,
};

export const useHomeStore = (set, get) => ({
  ...initialState,
  setAddStory: (v) => set({ addStoryEnable: v }),
  setIsProductPage: (v) => set({ isProductPage: v }),
  setOpenCamera: (open: boolean) => set({ OpenCamera: open }),
  setStoriesRefreshing: (refreshing: boolean) =>
    set({ storiesRefreshing: refreshing }),

  setIsRegisteringReady: (ready: boolean) => set({ isRegisteringReady: ready }),

  setCountries: (countries: any[]) => set({ countries }),

  setCurrency: (currency: any) => set({ currency }),

  setActiveRoute: (route: string) => set({ activeRoute: route }),
  setIsNavigating: (bool) => {
    if (!bool) {
      EnableScroll();
    }
    set({ isNavigating: bool });
  },
  setGAEvent: (eventName: string) =>
    set({ previous_event_button_name: eventName }),

  setLoginOpen: (open: boolean) => {
    if (open) {
      DisableScroll();
    } else {
      document.documentElement.scrollTo({ top: 0 });
      EnableScroll();
    }
    set({ loginOpen: open, showMessage: false });
  },

  watchStory: (payload: { id: string | number; pid: string | number }) =>
    set((state) => {
      if (!state.storiesData) return state;
      const arr = state.storiesData.map((story) => {
        if (story.id === payload.id) {
          const arrStories = story.stories.map((storyItem) => {
            if (storyItem.id === payload.pid) {
              return { ...storyItem, is_seen: true };
            }
            return storyItem;
          });
          return { ...story, stories: arrStories };
        }
        return story;
      });
      return { ...state, storiesData: arr };
    }),

  setAppLanguage: (language: string) => set({ language }),

  setAppCountry: (country: string) => set({ country }),

  setSelectedStory: (story: any) =>
    set((state) => ({
      selectedStory: story,
      renderStories: !state.renderStories,
    })),

  setStoryData: (data: Story[]) => {
    set({ storiesData: data, loadingStories: false });
  },

  nextStory: (currentId: string | number) =>
    set((state) => {
      if (!state.storiesData) return state;
      const index = state.storiesData?.findIndex(
        (story) => story.id === currentId,
      );
      if (index < state.storiesData.length - 1) {
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((_, i) => i === index + 1)[0],
          ),
          renderStories: !state.renderStories,
        };
      }
      return { ...state, selectedStory: null };
    }),

  prevStory: (currentId: string | number) =>
    set((state) => {
      if (!state.storiesData) return state;
      const index = state.storiesData?.findIndex(
        (story) => story.id === currentId,
      );
      if (index > 0) {
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((_, i) => i === index - 1)[0],
          ),
          renderStories: !state.renderStories,
        };
      }
      return { ...state, selectedStory: state.selectedStory };
    }),

  // Optimistically drop a single story item from a user's story group.
  // Removes the user entirely once they have no stories left, so both the
  // viewer and the stories bar reflect the deletion immediately without
  // depending on a (possibly stale) server refetch.
  removeStory: (userId: string | number, storyItemId: string | number) =>
    set((state) => {
      if (!state.storiesData) return state;
      const updated = state.storiesData
        .map((storyUser) => {
          if (String(storyUser.id) !== String(userId)) return storyUser;
          return {
            ...storyUser,
            stories: (storyUser.stories ?? []).filter(
              (item) => String(item.id) !== String(storyItemId),
            ),
          };
        })
        .filter((storyUser) => (storyUser.stories?.length ?? 0) > 0);
      return { ...state, storiesData: updated };
    }),

  addStory: (payload: any) =>
    set((state) => {
      if (!state.storiesData) return state;
      let arr = state.storiesData.map((storyItem) => {
        if (storyItem.id === payload.user_id) {
          return { ...storyItem, stories: [...storyItem.stories, payload] };
        }
        return storyItem;
      });

      if (
        !state.storiesData.some(
          (user) =>
            parseInt(user.id.toString()) ===
            parseInt(payload.user_id.toString()),
        )
      ) {
        arr.push({
          ...StoryServiceClass.getUserStories(),
          stories: [payload],
        });
      }

      return {
        ...state,
        storiesData: [
          arr.filter((storyUser) => storyUser.id === payload.user_id)[0],
          ...arr.filter((storyUser) => storyUser.id !== payload.user_id),
        ],
      };
    }),

  setSettings: (settings: Settings) => set({ settings }),
});
//   language: "en",
//   country: "",
//   loading: false,
//   loadingStories: true,
//   selectedStory: null,
//   renderStories: false,
//   OpenCamera: false,
//   storiesData: null,
//   categories: [],

//   settings: null,
//   loginOpen: false,
//   boutiques: [],
//   categories: [],
//   session_id: uuidv4(),
//   previous_event_button_name: null,
//   activeRoute: "/",
//   showMessage: false,
//   currency: null,
//   countries: [],
//   isRegisteringReady: true,
// };

// const HomeReducer = (state = initialState, { type, payload }) => {
//   switch (type) {

//     default:
//       return state;
//   }
// };
