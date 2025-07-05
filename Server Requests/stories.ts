"use server";
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
  let headers = userToken
    ? {
        method: "GET",
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
          language: language,
          country: country,
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }
    : {
        method: "GET",
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
          language: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: {
          tags: ["stories", "home"],
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_STORIES),
        },
      };
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${page}`,
      headers
    );

    if (!response.ok) {
      throw new Error(`Stories Error: ${response.status}`);
    }

    const result = await response.json();

    return {
      data: result.data?.data || [],
      next_page_url: result.data?.next_page_url,
    };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return {
      data: [],
      next_page_url: undefined,
    };
  }
}
