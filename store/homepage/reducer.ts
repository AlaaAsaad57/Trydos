import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import StoryServiceClass from "services/story";

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
  isNavigating: boolean;
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
  categories: [],
  settings: null,
  loginOpen: false,
  boutiques: [],
  session_id: uuidv4(),
  previous_event_button_name: null,
  activeRoute: "/",
  showMessage: false,
  currency: null,
  countries: [],
  isRegisteringReady: true,
  isNavigating: false,
};

export const useHomeStore = (set, get) => ({
  ...initialState,
  setAddStory: (v) => set({ addStoryEnable: v }),
  setOpenCamera: (open: boolean) => set({ OpenCamera: open }),

  setIsRegisteringReady: (ready: boolean) => set({ isRegisteringReady: ready }),

  setCountries: (countries: any[]) => set({ countries }),

  setCurrency: (currency: any) => set({ currency }),

  setActiveRoute: (route: string) => set({ activeRoute: route }),
  setIsNavigating: (bool) => set({ isNavigating: bool }),
  setGAEvent: (eventName: string) =>
    set({ previous_event_button_name: eventName }),

  setLoginOpen: (open: boolean) => {
    if (open) {
      document.documentElement.scrollTo({ top: 0 });
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.scrollTo({ top: 0 });
      document.documentElement.style.overflow = "initial";
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

  setStoryData: (data: Story[]) =>
    set({ storiesData: data, loadingStories: false }),

  nextStory: (currentId: string | number) =>
    set((state) => {
      if (!state.storiesData) return state;
      const index = state.storiesData?.findIndex(
        (story) => story.id === currentId
      );
      if (index < state.storiesData.length - 1) {
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((_, i) => i === index + 1)[0]
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
        (story) => story.id === currentId
      );
      if (index > 0) {
        return {
          ...state,
          selectedStory: StoryServiceClass.configureStory(
            state.storiesData.filter((_, i) => i === index - 1)[0]
          ),
          renderStories: !state.renderStories,
        };
      }
      return { ...state, selectedStory: state.selectedStory };
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
            parseInt(payload.user_id.toString())
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
