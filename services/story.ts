"use client";
import { StoriesInterface } from "models/Genaral/Story";

import { _isStoreLastJson, getLang } from "utils/functions";
import {
  GET_USERS_STORIES,
  LOG_IN_STORIES,
  UPLOAD_STORY_URL,
} from "utils/endpointConfig";

import Cookies from "js-cookie";
import axios from "axios";
import { GetStoriesApi } from "models/API/stories/GetStories";
import { LoginStoreisApi } from "models/API/stories/Login";
import { UploadStoryApi } from "models/API/stories/UploadStory";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";
import { AxiosGet } from "utils/AxiosApi";
import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";

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
    console.log(response);
    if (response.data.data) return response.data.data;
    else throw new Error("Failed");
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
          "/upload/w_720,h_1280,c_limit/f_auto/q_auto:good/fl_lossy/so_0"
        );
        returnedData.push({
          url: vid,
          link: storyItem.link,
          FixedUrl: vid,
          is_seen: storyItem.is_seen,
          id: storyItem.id,
          header: {
            heading: story.name ?? story.mobile_phone ?? "Unknown",
            subheading: formatTime(storyItem.created_at),
            profileImage: story.photo_path
              ? GetImageUrl(story.photo_path)
              : profilePicture.src,
          },
          duration: storyItem.duration,
          preloadResource: true,
          type: "video",
        });
      } else if (storyItem.photo_path) {
        let img = storyItem.photo_path.replace(
          "/upload",
          "/upload/w_720,h_1280,c_limit/f_auto/q_auto:good/fl_progressive:steep/e_sharpen"
        );
        returnedData.push({
          url: img,
          link: storyItem.link,
          placeholderUrl: storyItem.photo_path.replace(
            "/upload",
            "/upload/w_50,h_90,c_limit/f_auto/q_auto:low/e_blur:2000"
          ),
          FixedUrl: img,
          is_seen: storyItem.is_seen,
          duration: 5000,
          id: storyItem.id,
          header: {
            heading: story.name ?? story.mobile_phone ?? "Unknown",
            subheading: formatTime(storyItem.created_at),
            profileImage: story.photo_path
              ? GetImageUrl(story.photo_path)
              : profilePicture.src,
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
        return url.replace("/upload", "/upload/h_194/f_webp/q_100");
      } else return url.replace("/upload", "/upload/h_194/f_webp/q_100");
    }
  }
  async getStoriesForProducts({ id, page }) {
    try {
      // should test this
      let data = await fetchData({
        url: `/api/v1/stories/product_stories/${id}?page=${page}`,
        reqTitle: "Get Stories for Products",
        method: "GET",
        server: "stories",
      });
      return data.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}

const StoryServiceClass = new StoryService();
export default StoryServiceClass;
