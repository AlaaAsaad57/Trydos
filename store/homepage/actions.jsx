import StoryService from "services/story";
import Cookies from "js-cookie";
import { Sendevent } from "utils/functions";
import { changeAppLanguageServer, changeToken } from "./cachedActions";
import { useAppStore } from "store";
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
    window.history.pushState({ isPopup: true }, "open Cart");
  }
  if (e) {
    Sendevent({
      event: GA_EVENT_NAMES.CLICK,
      value: GA_CLICK_EVENT_VALUES.VIEW_STORY_BUTTON,
    });
    StoryService.WatchStory(e.stories[0].id, e.id);
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
    if (
      localStorage.getItem("USER-STORIES") &&
      JSON.parse(localStorage.getItem("USER-STORIES"))?.id === story.id
    )
      return 0;
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
