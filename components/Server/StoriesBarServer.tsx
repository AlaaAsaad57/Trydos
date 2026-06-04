import AddStory from "components/Home/AddStory";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { fetchStoriesForGuest, fetchStoriesForUser } from "@/serverRequests";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import AddStoryWidget from "components/Home/Stories/AddStoryWidget";
import StoriesWrapper from "components/clientWrapper/StoriesWrapper";

interface StoriesBarServerProps {
  language: string;
  country: string;
}

async function StoriesBarServer({ language, country }: StoriesBarServerProps) {
  const isRtl = language === "ar" || language === "ku";

  try {
    // Get user token from cookies if available. Read once and reuse below as
    // userData — it's the same cookie (USER_STORIES).
    const userData = await getCookieServer<UserData>(
      COOKIE_NAMES.USER_STORIES,
    );
    let storiesData, next_page_url;

    // Fetch stories data
    if (userData?.access_token) {
      storiesData = await fetchStoriesForUser(
        language,
        country,
        1,
        userData?.access_token,
      );
    } else {
      storiesData = await fetchStoriesForGuest(language, country, 1);
    }
    next_page_url = storiesData.next_page_url;
    storiesData = storiesData.data;
    return (
      <>
        {/* Adding Widget */}
        <AddStoryWidget />

        <div
          className={` stories-bar-container h-[183px] items-center flex w-full z-99999999 max-w-[1365px] justify-start`}
        >
          <div
            id="stories-bar"
            className={`stories-bar  w-full h-[183px] items-center flex justify-start ${
              isRtl && "flex-row-reverse"
            }`}
          >
            {/* open adding widget button */}
            <AddStory />
            {storiesData ? (
              <StoriesWrapper
                stories={storiesData}
                userData={userData}
                next_page_url={next_page_url}
                isRtl={isRtl}
              ></StoriesWrapper>
            ) : (
              <StoriesSkeleton />
            )}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error rendering stories:", error);
    return <StoriesSkeleton />;
  }
}

export default StoriesBarServer;
