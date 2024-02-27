"use client";
import React from "react";
import StoryComponent from "./StoryComponent";
import { useDispatch, useSelector } from "react-redux";
import { SelectStory } from "store/homepage/actions";
import AddStory from "./AddStory";
import { getUserStories } from "../../utils/functions";
function StoriesBar({ stories }) {
  const dispatch = useDispatch();
  const setSelectStory = (e) => {
    dispatch(SelectStory(e));
  };
  console.log("hi");
  return (
    <>
      <div className="stories-container">
        {stories?.map((story, index) => (
          <StoryComponent
            key={index}
            story={story}
            viewedStory={story.stories[0]}
            select={(e) => setSelectStory(e)}
          />
        ))}
        {getUserStories()?.id && <AddStory />}
      </div>
    </>
  );
}

export default StoriesBar;
