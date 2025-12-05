import StoryService from "services/story";

import { useAppStore } from "store";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import { COOKIE_NAMES, setCookie } from "utils/cookies/cookie-manager";

export const setLocalization = async (language, country) => {
  const { setAppCountry, setAppLanguage } = useAppStore.getState();
  if (country) {
    setAppCountry(country);
    setCookie(COOKIE_NAMES.COUNTRY, country);
  }
  if (language) {
    setAppLanguage(language);
    setCookie("language", country);
  }
  await fetch("/api/setLocal", {
    headers: {
      language: language,
      lang: language,
      country: country,
    },
    cache: "no-cache",
  });
};
/*Stories Actions */
export const SelectStory = (e) => {
  const { setSelectedStory } = useAppStore.getState();
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
  // if (typeof window !== "undefined") {
  //   const userStories = getCookie(COOKIE_NAMES.USER_STORIES);
  //   if (userStories && userStories?.id === story.id) {
  //     return story.stories.length - 1;
  //   }
  // }
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
