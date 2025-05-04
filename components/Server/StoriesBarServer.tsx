"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import AddStory from "components/Home/AddStory";
import StoriesBorder from "components/Home/Stories/StoriesBorder";
import StoryElement from "components/Home/Stories/StoryElement";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import React, { useEffect } from "react";
import { useAppStore } from "store";
import { getStoriesServer } from "store/homepage/cachedActions";

function StoriesBarServer() {
  const { storiesData, setStoryData } = useAppStore();
  const getStoriesData = async () => {
    const stories = await getStoriesServer();
    setStoryData(stories.data);
  };
  useEffect(() => {
    getStoriesData();
  }, []);
  try {
    return (
      <div className="stories-bar-container">
        <div id="stories-bar" className="stories-bar">
          {<AddStory />}
          {storiesData ? (
            <HortiznalScrollBar
              id="stories-bar-container"
              className="stories-bars pl-[10px]"
            >
              {storiesData?.map((story, index) => (
                <StoryElement key={index} index={index} story={story} />
              ))}
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
