"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import AddStory from "components/Home/AddStory";
import StoriesBorder from "components/Home/Stories/StoriesBorder";
import StoriesPagination from "components/Home/Stories/StoriesPagination";
import StoryElement from "components/Home/Stories/StoryElement";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import React, { useEffect, useState } from "react";
import StoryServiceClass from "services/story";
import { useAppStore } from "store";
import { getStoriesServer } from "store/homepage/cachedActions";

function StoriesBarServer() {
  const { storiesData, setStoryData } = useAppStore();
  const [next_page_url, setNextPageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const getData = async () => {
    setLoading(true);

    let { data, next_page_url } = await StoryServiceClass.getStories();
    setStoryData(data);
    setNextPageUrl(next_page_url);
    setLoading(false);
  };
  useEffect(() => {
    getData();
  }, []);

  try {
    return (
      <>
        {loading ? (
          <StoriesSkeleton />
        ) : (
          <div className="stories-bar-container">
            <div id="stories-bar" className="stories-bar">
              {<AddStory />}
              {storiesData ? (
                <HortiznalScrollBar
                  id="stories-bar-container"
                  className="flex h-full pl-[10px]"
                >
                  {storiesData?.map((story, index) => (
                    <StoryElement key={index} index={index} story={story} />
                  ))}
                  {next_page_url && (
                    <StoriesPagination next_page_url={next_page_url} />
                  )}
                </HortiznalScrollBar>
              ) : (
                <StoriesSkeleton />
              )}
            </div>
            <StoriesBorder />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error(error);
    return <StoriesSkeleton />;
  }
}

export default StoriesBarServer;
