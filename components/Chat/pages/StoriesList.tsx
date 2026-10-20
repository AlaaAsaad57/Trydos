import { useEffect, useState } from "react";
import { GetUnviewedStory, SelectStory } from "store/homepage/actions";
import StoryChatRow from "../components/StoryChatRow";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { dropQaStories } from "utils/qaStoryFilter";
import { LogError, translateFunction } from "utils/functions";
import Skeleton from "react-loading-skeleton";
import StoryServiceClass from "services/story";
function StoriesList() {
  const { storiesData, setStoryData, userStories } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    getStoriesData(1, true);
  }, []);

  const setSelectStory = (e) => {
    SelectStory(StoryServiceClass.configureStory(e));
  };

  const getStoriesData = async (pageNumber = 1, isInitial = false) => {
    if (loading || (!hasMoreStories && !isInitial)) return;

    try {
      setLoading(true);
      // The same path as the stories bar on the home page
      // (StoriesBarClient / StoriesPaginationWrapper): /api/proxy attaches the
      // HttpOnly stories token and renews it on a 401. The server action used
      // here before had no renewal, so once the 60-second token expired the
      // list lost what the shopper had already seen.
      const response: any = await fetchData({
        url: `/api/v1/stories/users_stories?page=${pageNumber}`,
        method: "GET",
        server: "stories",
        reqTitle: REQUESTS_DATA.GET_USER_STORIES,
        noMessage: true,
      });
      if (!response?.success) {
        throw new Error(response?.message);
      }

      if (response.data?.data) {
        const viewer = useAppStore.getState();
        const pageStories = dropQaStories(
          response.data.data,
          viewer.userProfile?.phone ?? viewer.user?.phone,
        );
        if (isInitial || pageNumber === 1) {
          // First load - replace existing data
          setStoryData(pageStories);
          setInitialLoad(false);
        } else {
          // Subsequent loads - append to existing data
          setStoryData([...storiesData, ...pageStories]);
        }

        // Update pagination state
        setPage(pageNumber + 1);
        setHasMoreStories(!!response.data.next_page_url);
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "getStoriesData in StoriesList - chat widget",
      });
      setHasMoreStories(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMoreStories) {
      getStoriesData(page);
    }
  };
  if (initialLoad && loading) {
    return (
      <div className="chat-list-items gap-[10px]">
        {[1, 1, 1, 1, 1].map((s, i) => (
          <div className="chat-conversation-item" key={i}>
            <div className="w-[50px] h-[50px] bg-gray-200 rounded-full">
              <Skeleton className="w-full h-full" borderRadius={100} />
            </div>
            <div className="w-[80px] ml-[10px] h-[14px] bg-gray-200 ">
              <Skeleton className="w-full h-full" borderRadius={2} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="chat-list-items gap-[10px]">
        {storiesData.map((story, index) => (
          <StoryChatRow
            key={story.id || index}
            index={index}
            story={story}
            stories={story}
            // As on the stories bar (StoryElement): the shopper's own row shows
            // their newest story, another author's the first one not seen yet.
            viewedStory={
              String(userStories?.id) === String(story.id)
                ? story.stories[story.stories.length - 1]
                : story.stories[GetUnviewedStory(story)]
            }
            select={(e) => setSelectStory(story)}
          />
        ))}

        {/* Infinite scroll trigger */}
        {hasMoreStories && (
          <div className="flex justify-center items-center py-4">
            {loading ? (
              <Spinner />
            ) : (
              <InView
                as="div"
                onChange={(inView) => {
                  if (inView) {
                    handleLoadMore();
                  }
                }}
                threshold={0.1}
              >
                <div className="h-4 w-full" />
              </InView>
            )}
          </div>
        )}

        {/* End of stories indicator */}
        {!hasMoreStories && storiesData.length > 0 && (
          <div className="flex justify-center items-center py-4 text-gray-500 text-sm">
            {translateFunction("No more stories")}
          </div>
        )}
      </div>
    </>
  );
}

export default StoriesList;
