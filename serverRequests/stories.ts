"use server";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { fetchServerData } from "./ServerFetch";
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
  // Auth from the dedicated STORIES_TOKEN cookie (kept fresh on re-auth by
  // /api/auth/update-user), consistent with the proxy. Fall back to a token
  // passed by the caller (e.g. the chat StoriesList widget) if the cookie is absent.
  const storiesToken =
    (await getCookieServer<string>(COOKIE_NAMES.STORIES_TOKEN)) || userToken;

  let headers = {
    ...(storiesToken && {
      Authorization: `Bearer ${storiesToken}`,
    }),
    Accept: "application/json",
  };
  try {
    const response = await fetchServerData({
      url: `${process.env.STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
      headers: headers,
    });
    if (response.isError) {
      LogServerError({
        source: "stories",
        page: "stories",
        status: response.status,
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
      url: `${process.env.STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      method: "GET",
      tags: ["stories", "home"],
     
      revalidate: 0,
      local: `${country}-${language}`,
      headers: headers,
    });
    if (response.isError) {
      LogServerError({
        source: "stories",
        page: "stories",
        status: response.status,
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
