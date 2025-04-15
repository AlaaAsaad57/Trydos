import AddStory from "components/Home/AddStory";
import StoriesBorder from "components/Home/Stories/StoriesBorder";
import StoryElement from "components/Home/Stories/StoryElement";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import React from "react";
import { getStoriesServer } from "store/homepage/cachedActions";

async function StoriesBarServer() {
  const { data: stories, error } = await getStoriesServer();
  try {
    return (
      <div className="stories-bar-container">
        <div id="stories-bar" className="stories-bar">
          <div className="stories-bars">
            {<AddStory />}

            {stories.map((story, index) => (
              <StoryElement key={index} index={index} story={story} />
            ))}
          </div>
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
