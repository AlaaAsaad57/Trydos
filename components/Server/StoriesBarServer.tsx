import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import AddStory from "components/Home/AddStory";
import StoriesBorder from "components/Home/Stories/StoriesBorder";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";
import StoriesStoreInitializer from "components/Home/Stories/StoriesStoreInitializer";
import StoryElement from "components/Home/Stories/StoryElement";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { fetchStories } from "@/Server Requests";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";

interface StoriesBarServerProps {
  language: string;
  country: string;
}

async function StoriesBarServer({ language, country }: StoriesBarServerProps) {
  try {
    // Get user token from cookies if available
    const STORIES_TOKEN = await getCookieServer<UserData>(
      COOKIE_NAMES.USER_STORIES
    );

    // Fetch stories data
    const { data: storiesData, next_page_url } = await fetchStories(
      language,
      country,
      1,
      STORIES_TOKEN?.access_token
    );

    return (
      <>
        <StoriesStoreInitializer initialStories={storiesData} />
        <div className="stories-bar-container">
          <div id="stories-bar" className="stories-bar">
            <AddStory />
            {storiesData && storiesData.length > 0 ? (
              <HortiznalScrollBar
                id="stories-bar-container"
                className="flex h-full pl-[10px]"
              >
                {storiesData.map((story, index) => (
                  <StoryElement
                    key={story.id || index}
                    index={index}
                    story={story}
                  />
                ))}
                {next_page_url && (
                  <StoriesPaginationWrapper
                    next_page_url={next_page_url}
                    language={language}
                    country={country}
                    initialStories={storiesData}
                  />
                )}
              </HortiznalScrollBar>
            ) : (
              <StoriesSkeleton />
            )}
          </div>
          <StoriesBorder />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error rendering stories:", error);
    return <StoriesSkeleton />;
  }
}

export default StoriesBarServer;
