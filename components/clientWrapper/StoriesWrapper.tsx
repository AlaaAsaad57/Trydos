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

  // Seed the shared story list from the page this bar was given — and only when
  // that page changes.
  //
  // This used to run on every route change as well, to repair the list after the
  // product page borrowed it. But the shared list is the ACCUMULATOR: the next
  // pages, the watched rings and the optimistic deletes all live in it and
  // nowhere else, while `stories` is page 1 as fetched. Re-seeding from page 1
  // therefore threw all of that away — and because a product opens as an
  // intercepted modal, the page counter in StoriesPaginationWrapper was never
  // unmounted and carried on from where it was, so the page after the lost one
  // was skipped for good. ProductStories now gives the list back when it closes,
  // so there is nothing left here to repair.
  useEffect(() => {
    setStoryData(stories);
  }, [stories]);

  // The add-story button spins until this runs, so it keeps the trigger it has
  // always had. Splitting it out is what lets the seeding above drop `pathname`.
  useEffect(() => {
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
