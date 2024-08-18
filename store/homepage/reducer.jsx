import { configureStory } from "utils/functions";
import { getUserStories } from "utils/functions";
import { v4 as uuidv4 } from "uuid";
const initialState = {
  language: "en",
  loading: false,
  loadingStories: true,
  selectedStory: null,
  renderStories: false,
  storiesData: null,
  categories: [],

  settings: null,
  loginOpen: false,
  boutiques: [],
  categories: [],
  session_id: uuidv4(),
  previous_event_button_name: null,
  activeRoute: "/",
  currency: null,
};

const HomeReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "CURRENCY": {
      return {
        ...state,
        currency: payload,
      };
    }
    case "ACTIVE-ROUTE": {
      return {
        ...state,
        activeRoute: payload,
      };
    }
    case "LOADING": {
      return {
        ...state,
        loading: true,
      };
    }
    case "GA-EVENT": {
      return {
        ...state,
        previous_event_button_name: payload,
      };
    }
    case "LOGIN-OPEN": {
      if (payload) {
        document.documentElement.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "initial";
      }
      return {
        ...state,
        loginOpen: payload,
      };
    }
    case "WATCH-STORY": {
      let arr = [];
      state.storiesData.map((story) => {
        if (story.id === payload.id) {
          let arrStories = [];
          story.stories.map((storyItem) => {
            if (storyItem.id === payload.pid) {
              arrStories.push({ ...storyItem, is_seen: true });
            } else {
              arrStories.push(storyItem);
            }
          });
          arr.push({ ...story, stories: arrStories });
        } else {
          arr.push(story);
        }
      });
      return {
        ...state,
        storiesData: arr,
      };
    }
    case "APP-LANGUAGE": {
      return { ...state, language: payload };
    }
    case "STORY-SELECTED": {
      return {
        ...state,
        selectedStory: payload,
        renderStories: !state.renderStories,
      };
    }
    case "STORY-DATA": {
      return { ...state, storiesData: payload, loadingStories: false };
    }
    case "NEXT-STORY": {
      let index;
      state.storiesData.map((story, i) => {
        if (story.id === payload) index = i;
      });
      if (index < state.storiesData.length - 1)
        return {
          ...state,
          selectedStory: configureStory(
            state.storiesData.filter((story, i) => i === index + 1)[0]
          ),
          renderStories: !state.renderStories,
        };
      else return { ...state, selectedStory: null };
    }
    case "PREV-STORY": {
      let index;
      state.storiesData.map((story, i) => {
        if (story.id === payload) index = i;
      });
      if (index > 0)
        return {
          ...state,
          selectedStory: configureStory(
            state.storiesData.filter((story, i) => i === index - 1)[0]
          ),
          renderStories: !state.renderStories,
        };
      else return { ...state, selectedStory: state.selectedStory };
    }
    case "ADD-STORY": {
      let arr = [];
      state.storiesData.map((storyItem) => {
        if (storyItem.id === payload.user_id) {
          arr.push({ ...storyItem, stories: [...storyItem.stories, payload] });
        } else {
          arr.push(storyItem);
        }
      });
      if (
        !state.storiesData.some(
          (user) => parseInt(user.id) === parseInt(payload.user_id)
        )
      ) {
        arr.push({ ...getUserStories(), stories: [payload] });
      }
      return {
        ...state,
        storiesData: [
          arr.filter((storyUser) => storyUser.id === payload.user_id)[0],
          ...arr.filter((storyUser) => storyUser.id !== payload.user_id),
        ],
      };
    }
    case "SITE-MAIN-DATA": {
      return {
        ...state,
        loading: false,
        boutiques: payload,
      };
    }
    case "GET_SETTINGS": {
      return {
        ...state,
        settings: payload.data,
      };
    }
    default:
      return state;
  }
};
export default HomeReducer;
