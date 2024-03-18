import { translations } from "public/translations/translations.js";
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
import profilePicture from "public/images/profileNo.png";
import { GET_USERS_STORIES, STORIES_URL } from "./endpointConfig";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};
export const getStories = async () => {
  try {
    let axios = (await import("axios")).default;
    const res = await axios.get(STORIES_URL + GET_USERS_STORIES, {
      headers: {
        Authorization:
          "Bearer " +
          JSON.parse(localStorage.getItem("USER-STORIES"))?.access_token,
      },
    });
    // hi
    const repo = res;
    return repo.data.data.data;
  } catch (e) {
    return [];
  }
};
export function translate(key, language) {
  if (translations[language] && translations[language][key]) {
    return translations[language][key] || key;
  } else return key;
}
export const getId = () => {
  return "img" + parseInt(Math.random() * 10000);
};

const token = SSRDetect() && localStorage.getItem("STORIES-TOKEN");
export const getStoriesHeaders = () => {
  return {
    headers: {
      Authentication: `Bearer ${token}`,
      Authorization: `Bearer ${token}`,
    },

    next: { tags: ["stories"], revalidate: 10000 },
  };
};
export const GeneralCahcedHeader = (apiName) => {
  return {
    next: { tags: [apiName], revalidate: 10000 },
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
      console.log(vid.toURL());
      returnedData.push({
        url: vid.toURL().includes("?")
          ? vid.toURL() + "&asa=" + parseInt(Math.random() * 1000).toString()
          : vid.toURL() + "?asa=" + parseInt(Math.random() * 1000).toString(),
        FixedUrl: vid,
        is_seen: storyItem.is_seen,
        FixedUrl: storyItem.full_video_path,
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
        url: img.toURL().includes("?")
          ? img.toURL() + "&asa=" + parseInt(Math.random() * 1000).toString()
          : img.toURL() + "?asa=" + parseInt(Math.random() * 1000).toString(),
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
