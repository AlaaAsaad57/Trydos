import { cookies } from "next/headers";
import { fetchServerData } from "./ServerFetch";
import { getThumb } from "utils/server";

export * from "./products";
export * from "./currency";
export * from "./stories";

export async function GetStarttingSetting({ language, country }) {
  let response = await fetchServerData({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/web/home/startingSettings",
    headers: {
      lang: language,
      country: country,
    },
    local: `${country}-${language}`,
    method: "GET",
  });
  return response.data.data?.["starting-setting"];
}

export async function GetProductStories({ page, productId }) {
  let cookiesStore = await cookies();
  let storiesToken = cookiesStore.get("USER-STORIES")?.value;
  let headers = {};
  if (storiesToken) {
    headers = { ...headers, Authorization: `Bearer ${storiesToken}` };
  }

  let response = await fetchServerData({
    url: `/api/v1/stories/product_stories/${productId}?page=${page}`,
    method: "GET",
    headers: headers,
  });
  return {
    data: response.data.data,
    items: response.data.data?.map((story, index) => (
      <div
        key={index}
        data-id={story.id}
        className="product-story relative"
        data-cy="Story"
        style={{
          boxShadow: "0 3px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {getStoryBorder(story)}
        <img
          width={111}
          height={160}
          src={getThumb(
            // @ts-ignore
            story.stories[0]?.full_video_path ||
              // @ts-ignore
              story.stories[0]?.photo_path,
            // @ts-ignore
            Boolean(story.stories[0]?.full_video_path)
          )}
        />
        <div className="inset-story-shadow absolute" />
      </div>
    )),
  };
}
const getStoryBorder = (story) => {
  // has new story
  if (story.stories.filter((s) => s.is_seen === false)?.length > 0) {
    return (
      <svg
        className="absolute top-0 left-0 z-40"
        xmlns="http://www.w3.org/2000/svg"
        width="111"
        height="160"
        viewBox="0 0 111 160"
      >
        <g
          id="Rectangle_6484"
          data-name="Rectangle 6484"
          fill="none"
          stroke="#513aaf"
          strokeWidth="0.5"
        >
          <rect width="111" height="160" rx="15" stroke="none" />
          <rect
            x="0.25"
            y="0.25"
            width="110.5"
            height="159.5"
            rx="14.75"
            fill="none"
          />
        </g>
      </svg>
    );
  } else {
    return (
      <svg
        className="absolute top-0 left-0 z-40"
        xmlns="http://www.w3.org/2000/svg"
        width="111"
        height="160"
        viewBox="0 0 111 160"
      >
        <g
          id="Rectangle_6484"
          data-name="Rectangle 6484"
          fill="none"
          stroke="#D3D3D3"
          strokeWidth="0.5"
        >
          <rect width="111" height="160" rx="15" stroke="none" />
          <rect
            x="0.25"
            y="0.25"
            width="110.5"
            height="159.5"
            rx="14.75"
            fill="none"
          />
        </g>
      </svg>
    );
  }
};
