import { configureStory } from "utils/functions";
import { getUserStories } from "utils/functions";
const initialState = {
  language: "en",
  loading: true,
  selectedStory: null,
  renderStories: false,
  storiesData: [],
  categories: [],
  settings: null,
};

const HomeReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "WATCH-STORY": {
      let arr = [];
      state.storiesData.map((story) => {
        if (story.id === payload.pid) {
          let arrStories = [];
          story.stories.map((storyItem) => {
            if (storyItem.id === payload.id) {
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
      return { ...state, storiesData: payload };
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
      else return { ...state, selectedStory: null };
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
        ...payload,
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
