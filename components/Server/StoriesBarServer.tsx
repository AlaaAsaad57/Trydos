import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import AddStory from "components/Home/AddStory";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";
import StoriesStoreInitializer from "components/Home/Stories/StoriesStoreInitializer";
import StoryElement from "components/Home/Stories/StoryElement";
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
    // Get user token from cookies if available
    const STORIES_TOKEN = await getCookieServer<UserData>(
      COOKIE_NAMES.USER_STORIES
    );
    let storiesData, next_page_url;
    let start = process.hrtime.bigint();
    // Fetch stories data
    if (STORIES_TOKEN?.access_token) {
      storiesData = await fetchStoriesForUser(
        language,
        country,
        1,
        STORIES_TOKEN?.access_token
      );
    } else {
      storiesData = await fetchStoriesForGuest(language, country, 1);
    }
    storiesData = storiesData.data;
    next_page_url = storiesData.next_page_url;

    let end = process.hrtime.bigint();
    let userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_STORIES);
    return (
      <>
        <AddStoryWidget />

        <StoriesStoreInitializer initialStories={storiesData} />
        <div
          className={` stories-bar-container h-[183px] items-center flex w-full z-[99999999] max-w-[1365px] justify-start`}
        >
          <div
            id="stories-bar"
            className={`stories-bar  w-full h-[183px] items-center flex justify-start ${
              isRtl && "flex-row-reverse"
            }`}
          >
            <AddStory />
            {storiesData && storiesData ? (
              <StoriesWrapper
                stories={storiesData}
                next_page_url={next_page_url}
                isRtl={isRtl}
              >
                {storiesData.map((story, index) => (
                  <StoryElement
                    key={story.id || index}
                    index={index}
                    story={story}
                    userData={userData}
                  />
                ))}
              </StoriesWrapper>
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
