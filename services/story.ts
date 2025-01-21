"use client";
import { StoriesInterface } from "models/Stories";
import { store } from "store";
import { _isStoreLastJson, getLang } from "utils/functions";
import {
  GET_USERS_STORIES,
  LOG_IN_STORIES,
  UPLOAD_STORY_URL,
} from "utils/endpointConfig";
import { getUserStories } from "utils/functions";
import Cookies from "js-cookie";
import axios from "axios";

class StoryService {
  /* get stories */

  async getStories() {
    const res = await fetch(
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + GET_USERS_STORIES,
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
      }
    );
    let repo = await res.json();

    const data: StoriesInterface[] = repo.data.data;
    store.dispatch({ type: "STORY-DATA", payload: data });
    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(res));
    }
    return data;
  }
  async loginStories() {
    const response = await axios.post(
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
  }
  async WatchStory(pid: number | string, id: number | string) {
    try {
      if (getUserStories()?.id) {
        store.dispatch({ type: "WATCH-STORY", payload: { pid: pid, id: id } });
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

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(response));
        }
      }
    } catch (e) {}
  }
  async upload(
    file: File,
    callback: Function,
    is_video: any,
    endUpload: Function
  ) {
    try {
      let axios = (await import("axios")).default;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("is_video", is_video);
      const response = await axios.post(
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
    }
  }
}

const StoryServiceClass = new StoryService();
export default StoryServiceClass;
