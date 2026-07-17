import AddStory from "components/Home/AddStory";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { fetchStoriesForGuest, fetchStoriesForUser } from "@/serverRequests";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import AddStoryWidget from "components/Home/Stories/AddStoryWidgetLazy";
import StoriesWrapper from "components/clientWrapper/StoriesWrapper";

interface StoriesBarServerProps {
  language: string;
  country: string;
}

async function StoriesBarServer({ language, country }: StoriesBarServerProps) {
  const isRtl = language === "ar" || language === "ku";

  try {
    // Profile blob (USER_STORIES) for display; auth from the dedicated
    // STORIES_TOKEN cookie, consistent with the proxy and fetchStoriesForUser.
    const userData = await getCookieServer<UserData>(
      COOKIE_NAMES.USER_STORIES,
    );
    const storiesToken = await getCookieServer<string>(
      COOKIE_NAMES.STORIES_TOKEN,
    );
    let storiesData, next_page_url;

    // Fetch stories data
    if (storiesToken) {
      storiesData = await fetchStoriesForUser(language, country, 1, storiesToken);
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
