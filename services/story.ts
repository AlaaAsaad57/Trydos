import axios from "axios";
import { StoriesInterface } from "models/Stories";
import { store } from "store";
import { DataApiHeaders } from "store/homepage/cachedActions";
import { _isStoreLastJson } from "utils/functions";
import {
  GET_USERS_STORIES,
  LOG_IN_STORIES,
  STORIES_URL,
  UPLOAD_STORY_URL,
} from "utils/endpointConfig";
import { getUserStories } from "utils/functions";
import Cookies from "js-cookie";
class StoryService {
  http = axios.create({
    baseURL: STORIES_URL,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-STORIES") &&
          JSON.parse(localStorage.getItem("USER-STORIES")).access_token),
      language: Cookies.get("language"),
      country: Cookies.get("country"),
    },
  });

  /* get stories */

  async getStories() {
    const res = await this.http.get(GET_USERS_STORIES);
    const data: StoriesInterface[] = res.data.data.data;
    store.dispatch({ type: "STORY-DATA", payload: data });
    if (typeof window !== "undefined") {
      console.log(_isStoreLastJson(), "_isStoreLastJson");
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(res));
    }
    return data;
  }
  async loginStories() {
    const Cookies = (await import("js-cookie")).default;
    const response = await this.http.post(LOG_IN_STORIES, {
      otp_id_token: localStorage.getItem("ID-TOKEN"),
      mobile_phone: "+" + JSON.parse(localStorage.getItem("USER")).phone,
    });
    Cookies.set("token", response.data.data.access_token);
    localStorage.setItem("USER-STORIES", JSON.stringify(response.data.data));
    Cookies.set("stories-token", response.data.data.access_token);
    localStorage.setItem("STORIES-TOKEN", response.data.data.access_token);

    if (typeof window !== "undefined") {
      console.log(_isStoreLastJson(), "_isStoreLastJson");
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
    }
  }
  async WatchStory(pid: number | string, id: number | string) {
    try {
      if (getUserStories()?.id) {
        store.dispatch({ type: "WATCH-STORY", payload: { pid: pid, id: id } });
        const response = await this.http.get(
          "/api/v1/stories/increase_viewers/" + pid
        );

        if (typeof window !== "undefined") {
          console.log(_isStoreLastJson(), "_isStoreLastJson");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("is_video", is_video);
      const response = await this.http.post(UPLOAD_STORY_URL, formData, {
        onUploadProgress: (progressEvent) => {
          callback(
            Math.round((progressEvent.loaded * 100) / progressEvent.total)
          );
        },
      });

      if (typeof window !== "undefined") {
        console.log(_isStoreLastJson(), "_isStoreLastJson");
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
