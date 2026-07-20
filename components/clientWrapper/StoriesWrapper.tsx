"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";
import StoryElement from "components/Home/Stories/StoryElement";
import { usePathname } from "node_modules/next/navigation";
import { useEffect } from "react";
import { useAppStore } from "store";

function StoriesWrapper({ next_page_url, isRtl, stories, userData }) {
  // Per-field selectors: mounted on the home page; avoids re-rendering the
  // whole stories bar on unrelated store writes.
  const setStoryData = useAppStore((s) => s.setStoryData);
  const storiesData = useAppStore((s) => s.storiesData);
  const loginOpen = useAppStore((s) => s.loginOpen);
  const storiesRefreshing = useAppStore((s) => s.storiesRefreshing);
  const setStoriesRefreshing = useAppStore((s) => s.setStoriesRefreshing);
  const pathname = usePathname();
  useEffect(() => {
    setStoryData(stories);
    if (storiesRefreshing) setStoriesRefreshing(false);
  }, [stories, pathname]);
  const storiesMap = storiesData?.length > 0 ? storiesData : stories;
  return (
    <HortiznalScrollBar
      id="stories-bar-container"
      className={`${
        isRtl && "flex-row-reverse"
      } flex h-full pl-[10px] gap-[15px] items-center`}
    >
      {storiesMap.map((story, index) => (
        <StoryElement
          key={story.id || index}
          index={index}
          story={story}
          userData={userData}
        />
      ))}
      {next_page_url && !loginOpen && (
        <StoriesPaginationWrapper
          userData={null}
          next_page_url={next_page_url}
        />
      )}
    </HortiznalScrollBar>
  );
}

export default StoriesWrapper;
