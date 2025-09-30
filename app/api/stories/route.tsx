import { NextRequest, NextResponse } from "next/server";
import { fetchServerData } from "serverRequests/ServerFetch";
import { ReportError } from "utils/errorReported";

export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const filters: any = {};
  try {
    let userToken = req.headers.get("auth");
    let lang = req.headers.get("language");
    let country = req.headers.get("country");
    let page = req.nextUrl.searchParams.get("page");
    let data = await fetchStories(lang, country, parseInt(page), userToken);
    return NextResponse.json(data, { headers });
  } catch (error: any) {
    let errorDesc = JSON.stringify(filters);
    return NextResponse.json(
      {
        error:
          `${error.message || "Unknown error"}----${errorDesc}` ||
          "Unknown error",
        appliedFilters: filters,
      },
      { status: 500, headers }
    );
  }
}
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

async function fetchStories(
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
    console.error("Error fetching stories:", error);
    return {
      data: [],
      next_page_url: undefined,
    };
  }
}
