import { translations } from "public/translations/translations.js";
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
import profilePicture from "public/images/profileNo.png";
import StoryServiceClass from "services/story";
import { store } from "store";
import Cookies from "js-cookie";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};
export const getStories = async () => {
  try {
    // hi
    const res = await StoryServiceClass.getStories();
    const repo = res;
    return repo;
  } catch (e) {
    return [];
  }
};
export function translate(key, language) {
  if (translations[language] && translations[language][key]) {
    return translations[language][key] || key;
  } else return key;
}

const token = SSRDetect() && localStorage.getItem("STORIES-TOKEN");
export const getStoriesHeaders = () => {
  return {
    headers: {
      Authentication: `Bearer ${token}`,
      Authorization: `Bearer ${token}`,
    },

    next: { tags: ["stories"], revalidate: 5403600 },
  };
};
export const GeneralCahcedHeader = (apiName) => {
  return {
    next: { tags: [apiName], revalidate: 5403600 },
  };
};
export const configureStory = (story) => {
  let returnedData = [];
  story?.stories?.map((storyItem) => {
    if (storyItem.full_video_path) {
      let vid = myCld()
        .video(storyItem.full_video_path?.split("/").pop().split(".")[0])
        .format("webm")
        .delivery(quality(auto()));
      returnedData.push({
        url: vid.toURL(),
        FixedUrl: vid,
        is_seen: storyItem.is_seen,

        id: storyItem.id,
        header: {
          heading: story.name ?? story.mobile_phone ?? "Unknown",
          subheading: "Posted 30m ago",
          profileImage: story.photo_path ?? profilePicture.src,
        },
        duration: 5000,
        preloadResource: true,
        type: "video",
      });
    } else if (storyItem.photo_path) {
      let img = myCld()
        .image(storyItem.photo_path?.split("/").pop().split(".")[0])
        .format("webp")
        .delivery(quality(auto()));
      returnedData.push({
        url: img.toURL(),
        FixedUrl: img,
        is_seen: storyItem.is_seen,
        duration: 5000,
        id: storyItem.id,
        header: {
          heading: story.name ?? story.mobile_phone ?? "Unknown",
          subheading: "Posted 30m ago",
          profileImage: story.photo_path ?? profilePicture.src,
        },
        preloadResource: true,
        type: "image",
      });
    }
  });
  return { ...story, stories: returnedData };
};
export const getThumb = (url, isVideo) => {
  if (url) {
    if (isVideo) {
      return myCld()
        .video(url?.split("/").pop().split(".")[0])
        .resize(Resize.thumbnail("145", "255"))
        .format("webp")
        .delivery(quality(50));
    } else
      return myCld()
        .image(url?.split("/").pop().split(".")[0])
        .resize(Resize.thumbnail("145", "255"))
        .format("webp")
        .delivery(quality(50));
  }
};
export const getUser = () => {
  return (
    localStorage.getItem("USER-CHAT") &&
    JSON.parse(localStorage.getItem("USER"))
  );
};
export const getUserChat = () => {
  return (
    localStorage.getItem("USER-CHAT") &&
    JSON.parse(localStorage.getItem("USER-CHAT"))
  );
};
export const getUserStories = () => {
  return (
    localStorage.getItem("USER-STORIES") &&
    JSON.parse(localStorage.getItem("USER-STORIES"))
  );
};

export const _isStoreLastJson = () => {
  return !!process.env.NEXT_PUBLIC_IS_STORE_LAST_JSON;
};
export const Sendevent = async (params: any) => {
  try {
    let userId = localStorage.getItem("USER")
      ? JSON.parse(localStorage.getItem("USER"))?.id
      : JSON.parse(localStorage.getItem("guest-user"))?.id;
    (window as any).gtag("event", params.event, {
      event_category: params.category,
      event_label: params.label,
      clicked_button_name: params.value,
      country_name: Cookies.get("country"),
      userID: userId,
      device_language: Cookies.get("language"),
      time_stamp: new Date().toISOString(),
      user_name:
        localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER"))?.name,
      sessionID: store.getState().homepage.session_id,
      previous_event_button_name:
        store.getState().homepage.previous_event_button_name,
    });
    store.dispatch({ type: "GA-EVENT", payload: params.value });
  } catch (e) {
    console.error(e);
  }
};
export const GetAppLanguage = () => {
  return store.getState().homepage.language;
};
export function encode_utf8(params: {
  s: string;
  element: NodeListOf<Element>;
}) {
  params.element.forEach((ele) => {
    ele.innerHTML = params.s;
  });
  return "";
}

export const getConfiguredImage = ({ src, width, height }) => {
  if (src.includes("cloudinary")) {
    return src.replace("/upload", `/upload/h_${height}/f_webp/q_auto`);
  } else return src;
};
export const getLang = (lang, cookieLang) => {
  if (lang) {
    if (lang === "ar") {
      return "ae";
    } else {
      return lang;
    }
  } else {
    if (cookieLang) {
      if (cookieLang === "ar") {
        return "ae";
      } else {
        return cookieLang;
      }
    } else {
      return "en";
    }
  }
};
