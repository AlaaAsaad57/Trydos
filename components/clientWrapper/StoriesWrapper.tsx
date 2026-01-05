"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";
import StoryElement from "components/Home/Stories/StoryElement";
import { useEffect } from "react";
import { useAppStore } from "store";

function StoriesWrapper({ next_page_url, isRtl, stories, userData }) {
  const { setStoryData, storiesData } = useAppStore();
  useEffect(() => {
    setStoryData(stories);
  }, []);
  let stories_data = storiesData?.length > 0 ? storiesData : stories;
  return (
    <HortiznalScrollBar
      id="stories-bar-container"
      className={`${
        isRtl && "flex-row-reverse"
      } flex h-full pl-[10px] gap-[15px] items-center`}
    >
      {stories_data.map((story, index) => (
        <StoryElement
          key={story.id || index}
          index={index}
          story={story}
          userData={userData}
        />
      ))}
      {next_page_url && (
        <StoriesPaginationWrapper
          userData={null}
          next_page_url={next_page_url}
          initialStories={stories}
        />
      )}
    </HortiznalScrollBar>
  );
}

export default StoriesWrapper;
