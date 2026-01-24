"use server";

import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import { fetchServerData } from "./ServerFetch";
import { ReportError } from "utils/errorReported";
import { LogServerError } from "utils/serverErrorReporter";

interface StoryItem {
  id: string | number;
  photo_path?: string;
  full_video_path?: string;
  link?: string;
  is_seen: boolean;
  created_at: string;
  duration?: number;
}

interface Story {
  id: string | number;
  name?: string;
  mobile_phone?: string;
  photo_path?: string;
  stories: StoryItem[];
}

interface StoriesResponse {
  data: Story[];
  next_page_url?: string;
}

export async function fetchStoriesForUser(
  language: string,
  country: string,
  page: number = 1,
  userToken?: string,
): Promise<StoriesResponse> {
  const STORIES_TOKEN = await getCookieServer<UserData>(
    COOKIE_NAMES.USER_STORIES,
  );

  let headers = {
    ...(STORIES_TOKEN?.access_token && {
      Authorization: `Bearer ${STORIES_TOKEN?.access_token ?? userToken}`,
    }),
    Accept: "application/json",
  };
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_NEST_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
      headers: headers,
    });
    if (response.isError) {
      ReportError(new Error(`Stories Error: ${response.status}`), {
        source: "stories",
        page: "stories",
        language,
        country,
        response: JSON.stringify(response)?.substring(0, 300),
      });
      return {
        data: [],
        next_page_url: undefined,
      };
    }
    return {
      data:
        response.data?.data?.data?.filter((s) => s?.stories?.length > 0) || [],
      next_page_url: response.data?.data?.next_page_url,
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In fetchStoriesForUser in serverRequest/stories",
    });
    return {
      data: [],
      next_page_url: undefined,
    };
  }
}

export async function fetchStoriesForGuest(
  language: string,
  country: string,
  page: number = 1,
): Promise<StoriesResponse> {
  let headers = {
    Accept: "application/json",
  };
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_NEST_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      method: "GET",
      tags: ["stories", "home"],
      // revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORIES),
      revalidate: 0,
      local: `${country}-${language}`,
      headers: headers,
    });
    if (response.isError) {
      ReportError(new Error(`Stories Error: ${response.status}`), {
        source: "stories",
        page: "stories",
        language,
        country,
        response: JSON.stringify(response)?.substring(0, 300),
      });
      return {
        data: [],
        next_page_url: undefined,
      };
    }
    return {
      data:
        response.data?.data?.data?.filter((s) => s?.stories?.length > 0) || [],
      next_page_url: response.data?.data?.next_page_url,
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In fetchStoriesForGuest in serverRequest/stories",
    });
    return {
      data: [],
      next_page_url: undefined,
    };
  }
}
