"use client";
import { _isStoreLastJson, LogError } from "utils/functions";
import { LOG_IN_STORIES } from "utils/endpointConfig";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";

import { formatTime, GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { REQUESTS_DATA } from "utils/Requests";

const MEDIA_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
const MEDIA_API_KEY = process.env.NEXT_PUBLIC_MEDIA_API_KEY ?? "";

class StoryService {
  /* get stories */

  async getStories(page: number = 1) {
    const { setStoryData, storiesData } = useAppStore.getState();

    try {
      const response = await fetchData({
        url: `/api/v1/stories/users_stories?page=${page}`,
        server: "stories",
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
  async uploadToMediaServer(file: File) {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("folder", "stories");

    const uploadUrl = file.type.startsWith("video/")
      ? `${MEDIA_SERVER_BASE_URL}/upload?story=true`
      : `${MEDIA_SERVER_BASE_URL}/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "x-api-key": MEDIA_API_KEY,
      },
      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.url) {
      throw new Error("Media server upload failed");
    }

    return {
      url: data.url as string,
      durationSeconds: data?.durationSeconds as number | undefined,
    };
  }
  async upload(
    file: File,
    callback: Function,
    is_video: any,
    endUpload: Function,
    link,
  ) {
    try {
      const response = await this.uploadToMediaServer(file);
      const add_story_response: any = await fetchData({
        url: `/api/v1/stories/add_story`,
        body: JSON.stringify({
          file_path:
            process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL + response.url,
          video_duration_in_second: parseInt(response.durationSeconds as any),
          is_video: is_video,
          link: link,
        }),
        method: "POST",
        reqTitle: REQUESTS_DATA.UPLOAD_STORY,
        server: "stories",
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
      // Propagate the failure so callers don't mistake a failed delete for a
      // success (otherwise the UI shows "deleted" while the story remains).
      throw error;
    }
  }
  async reportStory(
    storyId: string | number,
    reasons: string[],
    content: string,
  ) {
    try {
      const response = await fetchData({
        url: "/api/v1/stories/report_story",
        method: "POST",
        body: JSON.stringify({
          story_id: storyId,
          reasons,
          content,
        }),
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
      // Propagate the failure so the report UI can surface a real error instead
      // of a false "reported successfully" (the previous `return null` swallowed
      // errors, hiding failed reports from the user).
      throw error;
    }
  }
  getUserStories() {
    return useAppStore.getState().userStories;
  }
  configureStory(story) {
    const withMediaBase = (url?: string) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      const normalizedPath = url.startsWith("/") ? url : `/${url}`;
      return `${MEDIA_SERVER_BASE_URL}${normalizedPath}`;
    };

    let returnedData = [];
    story?.stories?.map((storyItem) => {
      if (storyItem.full_video_path) {
        const vid = withMediaBase(storyItem.full_video_path);
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
          duration: storyItem.video_duration_in_second,
          preloadResource: true,
          type: "video",
        });
      } else if (storyItem.photo_path) {
        const sourceImage = withMediaBase(storyItem.photo_path);
        let img = sourceImage.replace(
          "/upload",
          "/upload/w_720,c_pad/f_auto/q_auto:good",
        );
        returnedData.push({
          url: img,
          link: storyItem.link,
          placeholderUrl: sourceImage.replace(
            "/upload",
            "/upload/w_50,h_90,c_limit/f_auto/q_auto:low",
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
        return url + "?target=snapshot";
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
