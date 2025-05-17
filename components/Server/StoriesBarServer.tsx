import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import AddStory from "components/Home/AddStory";
import StoriesBorder from "components/Home/Stories/StoriesBorder";
import StoriesPagination from "components/Home/Stories/StoriesPagination";
import StoryElement from "components/Home/Stories/StoryElement";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import React from "react";
import { getStoriesServer } from "store/homepage/cachedActions";

async function StoriesBarServer() {
  const { data, next_page_url } = await getStoriesServer();

  try {
    return (
      <div className="stories-bar-container">
        <div id="stories-bar" className="stories-bar">
          {<AddStory />}
          {data ? (
            <HortiznalScrollBar
              id="stories-bar-container"
              className="stories-bars pl-[10px]"
            >
              {data?.map((story, index) => (
                <StoryElement key={index} index={index} story={story} />
              ))}
              <StoriesPagination next_page_url={next_page_url} />
            </HortiznalScrollBar>
          ) : (
            <StoriesSkeleton />
          )}
        </div>
        <StoriesBorder />
      </div>
    );
  } catch (error) {
    console.error(error);
    return <StoriesSkeleton />;
  }
}

export default StoriesBarServer;
