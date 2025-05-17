"use client";
import { StoriesInterface } from "models/Stories";

import { _isStoreLastJson, getLang } from "utils/functions";
import {
  GET_USERS_STORIES,
  LOG_IN_STORIES,
  UPLOAD_STORY_URL,
} from "utils/endpointConfig";

import Cookies from "js-cookie";
import axios from "axios";
import { GetStoriesApi, LoginStoreisApi, UploadStoryApi } from "models/Api";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";

class StoryService {
  /* get stories */

  async getStories(page: number = 1) {
    const { setStoryData, storiesData } = useAppStore.getState();
    const res = await fetch(
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
        GET_USERS_STORIES +
        `?page=${page}`,
      {
        headers: {
          Authorization:
            "Bearer " +
            (typeof localStorage !== "undefined" &&
              localStorage.getItem("USER-STORIES") &&
              JSON.parse(localStorage.getItem("USER-STORIES"))?.access_token),
          language: Cookies.get("language"),

          country: Cookies.get("country"),
        },
      }
    );
    let repo: GetStoriesApi = await res.json();
    const data: StoriesInterface[] = repo.data.data;
    if (page == 1) {
      setStoryData(data);
    } else {
      setStoryData([...storiesData, ...data]);
    }
    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(res));
    }
    return { data, next_page_url: repo.data.next_page_url };
  }
  async loginStories() {
    const response: LoginStoreisApi = await axios.post(
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + LOG_IN_STORIES,
      {
        otp_id_token: localStorage.getItem("ID-TOKEN"),
        mobile_phone: JSON.parse(localStorage.getItem("USER")).phone,
      }
    );
    let repo = response.data;
    localStorage.setItem("USER-STORIES", JSON.stringify(repo.data));
    Cookies.set("stories-token", repo.data?.access_token);
    localStorage.setItem("STORIES-TOKEN", repo.data?.access_token);

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
    }
    await this.getStories();
  }
  async WatchStory(pid: number | string, id: number | string) {
    const { watchStory } = useAppStore.getState();
    try {
      if (this.getUserStories()?.id) {
        watchStory({ pid: pid, id: id });

        const response = await fetch(
          process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
            "/api/v1/stories/increase_viewers/" +
            pid,
          {
            headers: {
              Authorization:
                "Bearer " +
                (typeof localStorage !== "undefined" &&
                  localStorage.getItem("USER-STORIES") &&
                  JSON.parse(localStorage.getItem("USER-STORIES"))
                    .access_token),
              language: Cookies.get("language"),

              country: Cookies.get("country"),
            },
          }
        );
        let repo = await response.json();
        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
    } catch (e) {}
  }
  async upload(
    file: File,
    callback: Function,
    is_video: any,
    endUpload: Function,
    link
  ) {
    try {
      let axios = (await import("axios")).default;
      const formData = new FormData();
      if (link?.length) {
        formData.append("link", link);
      }
      formData.append("file", file);
      formData.append("is_video", is_video);
      const response: UploadStoryApi = await axios.post(
        process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + UPLOAD_STORY_URL,
        formData,
        {
          headers: {
            Authorization:
              "Bearer " +
              (typeof localStorage !== "undefined" &&
                localStorage.getItem("USER-STORIES") &&
                JSON.parse(localStorage.getItem("USER-STORIES")).access_token),
            language: Cookies.get("language"),

            country: Cookies.get("country"),
          },
          onUploadProgress: (progressEvent) => {
            callback(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
          },
        }
      );

      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(response));
      }
      endUpload();
      return response.data.data;
    } catch (e) {
      callback(null);
      endUpload();
      throw e;
    }
  }
  getUserStories() {
    return (
      localStorage.getItem("USER-STORIES") &&
      JSON.parse(localStorage.getItem("USER-STORIES"))
    );
  }
  configureStory(story) {
    let returnedData = [];
    story?.stories?.map((storyItem) => {
      if (storyItem.full_video_path) {
        let vid = storyItem.full_video_path.replace(
          "/upload",
          "/upload/w_700/f_webm/q_auto"
        );
        returnedData.push({
          url: vid,
          link: storyItem.link,
          FixedUrl: vid,
          is_seen: storyItem.is_seen,
          id: storyItem.id,
          header: {
            heading: story.name ?? story.mobile_phone ?? "Unknown",
            subheading: "Posted 30m ago",
            profileImage: story.photo_path ?? profilePicture.src,
          },
          duration: storyItem.duration,
          preloadResource: true,
          type: "video",
        });
      } else if (storyItem.photo_path) {
        let img = storyItem.photo_path.replace(
          "/upload",
          "/upload/w_800/f_avif/q_auto"
        );
        returnedData.push({
          url: img,
          link: storyItem.link,
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
  }
  getThumb(url, isVideo) {
    if (url) {
      if (isVideo) {
        return url.replace("/upload", "/upload/h_194/f_avif/q_100");
      } else return url.replace("/upload", "/upload/h_194/f_avif/q_100");
    }
  }
}

const StoryServiceClass = new StoryService();
export default StoryServiceClass;
