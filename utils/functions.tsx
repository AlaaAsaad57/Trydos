import { translations } from "public/translations/translations.js";
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
      let vid = story.full_video_path.replace(
        "/upload",
        "/upload/w_700/f_webm/q_auto"
      );
      returnedData.push({
        url: vid,
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
      let img = story.full_video_path.replace(
        "/upload",
        "/upload/w_800/f_webp/q_auto"
      );
      returnedData.push({
        url: img,
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
      return url.replace("/upload", "/upload/h_100/f_webp/q_100");
    } else return url.replace("/upload", "/upload/h_100/f_webp/q_100");
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
