import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactInstaStories from "react-insta-stories";
import Loader from "components/global/Loader";
import {
  GetUnviewedStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import { StoryType } from "models/story";
interface Props {
  story: StoryType;
  active: boolean;
  currentStoryId: number;
  setCurrentStoryId: Function;
  isPaused: boolean;
}
function StoryHolder({
  story,
  active,
  currentStoryId,
  setCurrentStoryId,
  isPaused,
}: Props) {
  const dispatch = useDispatch();
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  return (
    <>
      <div className="story-holder">
        {active && (
          <ReactInstaStories
            key={story.id}
            isPaused={isPaused}
            preloadCount={1}
            loader={<Loader style={{}} />}
            currentIndex={GetUnviewedStory(selectedStory)}
            onPrevious={() => {
              if (active) {
                currentStoryId > 0
                  ? setCurrentStoryId(currentStoryId - 1)
                  : dispatch(setPreviousStory(story.id));
              }
            }}
            onNext={() => {
              if (active) {
                currentStoryId < story.stories.length
                  ? setCurrentStoryId(currentStoryId + 1)
                  : dispatch(setNextStory(story.id));
              }
            }}
            stories={story.stories}
            storyContainerStyles={{
              width: "100%",
              height: "100%",
              display: "flex",
            }}
            storyStyles={{
              width: "100wv",
              height: "auto",
              minWidth: "90px",
              maxHeight: "96vh",
              maxWidth: "96vw",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            width={"100vw"}
            height={"100vh"}
            onAllStoriesEnd={() => {
              setTimeout(() => {
                if (active) {
                  setCurrentStoryId(0);
                  dispatch(setNextStory(selectedStory.id));
                }
              }, 10);
            }}
            onStoryEnd={() => {
              if (active) {
                currentStoryId < story.stories.length - 1
                  ? setCurrentStoryId(currentStoryId + 1)
                  : dispatch(setNextStory(story.id));
              }
            }}
          />
        )}
      </div>
    </>
  );
}

export default StoryHolder;
