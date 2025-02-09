import StoryService from "services/story";
import Cookies from "js-cookie";
import { Sendevent } from "utils/functions";
import { changeAppLanguageServer, changeToken } from "./cachedActions";
export const changeAppLanguage = (language) => {
  Cookies.set("language", language, {
    expires: 365,
  });
  changeAppLanguageServer(language);
  return { type: "APP-LANGUAGE", payload: language };
};
export const changeAppCountry = (iso) => {
  Cookies.set("country", iso, {
    expires: 365,
  });
  changeToken({ key: "country", value: iso });
  return { type: "APP-COUNTRY", payload: iso };
};
export const GetMainData = (data) => {
  return { type: "SITE-MAIN-DATA", payload: data };
};
/*Stories Actions */
export const SelectStory = (e) => {
  if (e) {
    window.history.pushState({ isPopup: true }, "open Cart");
  }
  if (e) {
    Sendevent({ event: "button_clicked", value: "view_story_button" });
    StoryService.WatchStory(e.stories[0].id, e.id);
  }
  return { type: "STORY-SELECTED", payload: e };
};
export const GetStoryData = (data) => {
  return { type: "STORY-DATA", payload: data };
};
export const setNextStory = (storyId) => {
  return { type: "NEXT-STORY", payload: storyId };
};
export const setPreviousStory = (storyId) => {
  return { type: "PREV-STORY", payload: storyId };
};
export const AddStoryAction = (story) => {
  return { type: "ADD-STORY", payload: story };
};
export const GetUnviewedStory = (story) => {
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
