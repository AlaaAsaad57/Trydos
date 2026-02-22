"use client";
import { _isStoreLastJson, LogError } from "utils/functions";
import { LOG_IN_STORIES } from "utils/endpointConfig";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";

import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { REQUESTS_DATA } from "utils/Requests";

class StoryService {
  /* get stories */

  async getStories(page: number = 1) {
    const { setStoryData, storiesData } = useAppStore.getState();

    try {
      const response = await fetchData({
        url:
          process.env.NEXT_PUBLIC_NEST_STORIES_BACKEND_URL +
          `/api/v1/stories/users_stories?page=${page}`,
        server: "nest-stories",
        reqTitle: REQUESTS_DATA.GET_USER_STORIES,
        method: "GET",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      let repo: any = response;
      let data = repo.data.data;
      if (page == 1) {
        setStoryData(data);
      } else {
        setStoryData([...storiesData, ...data]);
      }
      return { data, next_page_url: repo.data.next_page_url };
    } catch (error) {
      LogError({
        error,
        scenario: "Error in getStories in services/story",
      });
      throw new Error("get stories error");
    }
    // @ts-ignore
  }
  async loginStories() {
    const { loginSuccessStories, userProfile } = useAppStore.getState();
    const user = userProfile;
    try {
      const response = await fetchData({
        url: LOG_IN_STORIES,
        reqTitle: REQUESTS_DATA.LOGIN_STORIES,
        method: "POST",
        server: "stories",
        body: JSON.stringify({
          otp_id_token: localStorage.getItem("ID-TOKEN"),
          mobile_phone: user?.phone,
        }),
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      // Update HttpOnly cookie via server route
      fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ name: COOKIE_NAMES.USER_STORIES, value: response.data }],
        }),
        credentials: "include",
      });
      loginSuccessStories({
        ...response.data,
      });
      await this.getStories();
    } catch (error) {
      LogError({
        error,
        scenario: "Error in loginStories in services/story",
      });
    }
  }
  async WatchStory(pid: number | string, id: number | string) {
    const { watchStory } = useAppStore.getState();
    try {
      if (this.getUserStories()?.id) {
        watchStory({ pid: pid, id: id });
        const res = await fetchData({
          url: "/api/v1/stories/increase_viewers/" + pid,
          server: "stories",
          reqTitle: REQUESTS_DATA.INCREASE_VIEWERS,
          method: "GET",
        });
        if (!res.success) {
          throw new Error(res?.message);
        }
      }
    } catch (error) {
      LogError({
        error,
        scenario: "Error in WatchStory in services/story",
      });
    }
  }
  async UploadToCloudinary(file: File) {
    const url = "https://api.cloudinary.com/v1_1/djooohujg/upload";

    const formData = new FormData();

    // Fill in your own unsigned upload preset
    formData.append("file", file);
    formData.append("upload_preset", "v4h8xqns");

    let response = await fetchData({
      url: url,
      method: "POST",
      body: formData,
      reqTitle: REQUESTS_DATA.UPLOAD_CLOUDINARY,
      server: "upload story",
    });
    if (!response.success) {
      throw new Error("");
    }
    return response.url;
  }
  async upload(
    file: File,
    callback: Function,
    is_video: any,
    endUpload: Function,
    link,
  ) {
    try {
      let response = await this.UploadToCloudinary(file);
      const add_story_response: any = await fetchData({
        url: `/api/v1/stories/add_story`,
        reqTitle: REQUESTS_DATA.UPLOAD_STORY,
        method: "POST",
        server: "stories",
        body: JSON.stringify({
          file_path: response,
          is_video: is_video,
          link: link,
        }),
      });

      // @ts-ignore
      if (!add_story_response.success) {
        // @ts-ignore
        throw new Error(add_story_response.message);
      }
      endUpload();

      if (add_story_response.data) {
        return add_story_response.data;
      } else throw new Error("Failed");
    } catch (error) {
      LogError({
        error,
        scenario: "Error in upload in services/story",
      });
      throw new Error(error?.message);
    }
  }
  async deleteStory(storyId: string | number) {
    try {
      const response = await fetchData({
        url: "/api/v1/stories/delete_story",
        method: "POST",
        body: JSON.stringify({ story_id: storyId }),
        reqTitle: REQUESTS_DATA.DELETE_STORY,
        server: "stories",
        noMessage: true,
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      LogError({
        error,
        scenario: "Error in deleteStory in services/story",
      });
      return null;
    }
  }
  async reportStory(storyId: string | number) {
    try {
      const response = await fetchData({
        url: "",
        method: "POST",
        body: JSON.stringify({ story_id: storyId }),
        reqTitle: REQUESTS_DATA.REPORT_STORY,
        server: "stories",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      LogError({
        error,
        scenario: "Error in reportStory in services/story",
      });
      return null;
    }
  }
  getUserStories() {
    return useAppStore.getState().userStories;
  }
  configureStory(story) {
    let returnedData = [];
    story?.stories?.map((storyItem) => {
      if (storyItem.full_video_path) {
        let vid = storyItem.full_video_path.replace(
          "/upload",
          "/upload/w_720,h_1280,c_limit/f_auto/q_auto:good/fl_lossy/so_0",
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
          product_id: storyItem.product_id,
          product_slug: storyItem.product_slug,
          duration: storyItem.duration,
          preloadResource: true,
          type: "video",
        });
      } else if (storyItem.photo_path) {
        let img = storyItem.photo_path.replace(
          "/upload",
          "/upload/w_720,h_1280,c_pad/f_auto/q_auto:good/fl_progressive:steep/e_sharpen",
        );
        returnedData.push({
          url: img,
          link: storyItem.link,
          placeholderUrl: storyItem.photo_path.replace(
            "/upload",
            "/upload/w_50,h_90,c_limit/f_auto/q_auto:low/e_blur:2000",
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
          product_id: storyItem.product_id,
          product_slug: storyItem.product_slug,
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
        reqTitle: REQUESTS_DATA.GET_STORIES_FOR_PRODUCTS,
        method: "GET",
        server: "stories",
      });

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      LogError({
        error,
        scenario: "Error in getStoriesForProducts in services/story",
      });
      return [];
    }
  }
}

const StoryServiceClass = new StoryService();
export default StoryServiceClass;
