import React, { useEffect, useState } from "react";
import { GetUnviewedStory, SelectStory } from "store/homepage/actions";
import StoryChatRow from "../components/StoryChatRow";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { fetchStoriesForUser } from "serverRequests";
import { getUserStories, LogError } from "utils/functions";
import Skeleton from "react-loading-skeleton";
import StoryServiceClass from "services/story";
function StoriesList() {
  const { storiesData, language, country, setStoryData } = useAppStore();
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
      const response = await fetchStoriesForUser(
        language,
        country,
        pageNumber,
        getUserStories().access_token,
      );

      if (response.data) {
        if (isInitial || pageNumber === 1) {
          // First load - replace existing data
          setStoryData(response.data);
          setInitialLoad(false);
        } else {
          // Subsequent loads - append to existing data
          setStoryData([...storiesData, ...response.data]);
        }

        // Update pagination state
        setPage(pageNumber + 1);
        setHasMoreStories(!!response.next_page_url);
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
            viewedStory={story.stories[GetUnviewedStory(story)]}
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
