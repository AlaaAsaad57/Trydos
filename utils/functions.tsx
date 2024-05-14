import { translations } from "public/translations/translations.js";
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
import profilePicture from "public/images/profileNo.png";
import StoryServiceClass from "services/story";
import { useEffect, useState } from "react";
import { event } from "nextjs-google-analytics";
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
    console.log(e);
    return [];
  }
};
export function translate(key, language) {
  if (translations[language] && translations[language][key]) {
    return translations[language][key] || key;
  } else return key;
}
export const getId = () => {
  return "img" + parseInt((Math.random() * 10000).toString());
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
export const useTimers = ({ durationValue }) => {
  const [temp, setTemp] = useState(0);
  const [duration, setDuration] = useState(durationValue);
  const [isFinished, Finished] = useState(false);
  const [isPaused, Paused] = useState(false);
  useEffect(() => {
    let interval = setInterval(() => {
      if (!isPaused) {
        if (temp !== duration && duration - temp > 200) {
          setTemp((oldValue) => oldValue + 200);
        } else {
          setTemp(duration);
          Finished(true);
        }
      } else {
        return;
      }
    }, 150);
    return () => clearInterval(interval);
  }, [temp]);
  return {
    isFinished: isFinished,
    time: (temp * 100) / duration,
    reset: (b) => {
      setTemp(0);
      setDuration(b || duration);
      Finished(false);
    },
    isPaused: isPaused,
    Paused: (e) => Paused(e),
  };
};
export const Sendevent = (params: any) => {
  try {
    console.log(params);
    event({ ...params });
  } catch (e) {
    console.error(e);
  }
};
