import StoryService from "services/story";
import Cookies from "js-cookie";
import { changeAppLanguageServer, changeToken } from "./cachedActions";
import { useAppStore } from "store";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
export const changeAppLanguage = (language) => {
  const { setAppLanguage } = useAppStore.getState();
  Cookies.set("language", language, {
    expires: 365,
  });
  changeAppLanguageServer(language);
  changeToken({ key: "language", value: language });
  changeToken({ key: "lang", value: language });
  setAppLanguage(language);
};
export const changeAppCountry = async (iso) => {
  const { setAppCountry } = useAppStore.getState();

  // Cookies.set("country", iso, {
  //   expires: 365,
  // });
  await changeToken({ key: "country", value: iso });
  setAppCountry(iso);
};

/*Stories Actions */
export const SelectStory = (e) => {
  const { setSelectedStory } = useAppStore.getState();

  if (e) {
    window.history.pushState({ isPopup: true }, "open Stories");
  }
  if (e) {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.VIEW_STORY_BUTTON,
    // });
    StoryService.WatchStory(e.stories[0].id, e.id);
    let url = window.location.pathname;

    GAevent({
      action: GA_EVENT_NAMES.VIEW_STORY,
      params: {
        user_id_custom: auth.UserID(),
        story_id: e.stories[0].id,
        item_id: e.stories[0].product_id,
        item_name: e.stories[0].product_id,
        story_type: e.stories[0].full_video_path ? "video" : "image",
        link: e.stories[0]?.link,
        product_link: Boolean(e.stories[0].product_id),
        screen_name: url?.includes("/products")
          ? GA_GLOBAL_SCREEN.PRODUCT_SCREEN
          : GA_GLOBAL_SCREEN.HOME_SCREEN,
        screen_path: url,
      },
    });
  }
  setSelectedStory(e);
};

export const setNextStory = (storyId) => {
  const { nextStory } = useAppStore.getState();

  nextStory(storyId);
};
export const setPreviousStory = (storyId) => {
  const { prevStory } = useAppStore.getState();
  prevStory(storyId);
};
export const AddStoryAction = (story) => {
  const { addStory } = useAppStore.getState();
  addStory(story);
};
export const GetUnviewedStory = (story) => {
  if (typeof window !== "undefined") {
    const userStories = getCookie(COOKIE_NAMES.USER_STORIES);
    if (userStories && userStories?.id === story.id) {
      return story.stories.length - 1;
    }
  }
  let index = 0;
  let unseen = [];
  story.stories.map((s, id) => {
    if (s.is_seen === false) {
      unseen.push(s);
    }
  });
  if (unseen.length > 0)
    story.stories.map((s, id) => {
      if (s.id === unseen[0].id) {
        index = id;
      }
    });

  return index;
};

export const LogData = (data) => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") {
    // console.log(data);
  }
};
