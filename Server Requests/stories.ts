"use server";
import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

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

export async function fetchStories(
  language: string,
  country: string,
  page: number = 1,
  userToken?: string
): Promise<StoriesResponse> {
  let headers = {
    ...(userToken && { Authorization: `Bearer ${userToken}` }),
    Accept: "application/json",
  };
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      method: "GET",
      tags: ["stories", "home"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORIES),
      local: `${country}-${language}`,
      headers: headers,
    });

    if (response.isError) {
      console.error(`Stories Error: ${response.status}`);
      reportError(new Error(`Stories Error: ${response.status}`), {
        source: "stories",
        page: "stories",
        language: language,
        country: country,
        response: JSON.stringify(response),
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
    console.error("Error fetching stories:", error);
    return {
      data: [],
      next_page_url: undefined,
    };
  }
}
