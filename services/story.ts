"use client";
import { StoriesInterface } from "models/Genaral/Story";

import { _isStoreLastJson, getLang } from "utils/functions";
import {
  GET_USERS_STORIES,
  LOG_IN_STORIES,
  UPLOAD_STORY_URL,
} from "utils/endpointConfig";
import { GetStoriesApi } from "models/API/stories/GetStories";
import { LoginStoreisApi } from "models/API/stories/Login";
import { UploadStoryApi } from "models/API/stories/UploadStory";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";

import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
  setCookie,
} from "utils/cookies/cookie-manager";

class StoryService {
  /* get stories */

  async getStories(page: number = 1) {
    const { setStoryData, storiesData } = useAppStore.getState();
    const response = await fetchData({
      url: GET_USERS_STORIES + `?page=${page}`,
      server: "stories",
      reqTitle: "Get Stories",
      method: "GET",
    });
    let repo: GetStoriesApi = response;
    const data: StoriesInterface[] = repo.data.data;
    if (page == 1) {
      setStoryData(data);
    } else {
      setStoryData([...storiesData, ...data]);
    }

    return { data, next_page_url: repo.data.next_page_url };
  }
  async loginStories() {
    const { loginSuccessStories } = useAppStore.getState();
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    const response = await fetchData({
      url: LOG_IN_STORIES,
      reqTitle: "Login Stories",
      method: "POST",
      server: "stories",
      body: JSON.stringify({
        otp_id_token: localStorage.getItem("ID-TOKEN"),
        mobile_phone: user?.phone,
      }),
    });
    setCookie(COOKIE_NAMES.USER_STORIES, response.data);
    loginSuccessStories({
      ...response.data,
    });
    await this.getStories();
  }
  async WatchStory(pid: number | string, id: number | string) {
    const { watchStory } = useAppStore.getState();
    try {
      if (this.getUserStories()?.id) {
        watchStory({ pid: pid, id: id });
        await fetchData({
          url: "/api/v1/stories/increase_viewers/" + pid,
          server: "stories",
          reqTitle: "Increase Viewers",
          method: "GET",
        });
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
    const response: UploadStoryApi = await fetchData({
      url: UPLOAD_STORY_URL,
      reqTitle: "Upload Story",
      method: "POST",
      server: "stories",
      body: formData,
    });
    endUpload();

    if (response.data) return response.data;
    else throw new Error("Failed");
  }
  getUserStories() {
    return getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
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
