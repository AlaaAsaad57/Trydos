import React from "react";
import ReactInstaStories from "react-insta-stories";
import {
  GetUnviewedStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import { configureStory } from "./functions";
import { useDispatch, useSelector } from "react-redux";

function StoriesLists({
  currentStoryInd,
  currentStoryId,
  index,
  story,
  setCurrentStoryId,
}) {
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const dispatch = useDispatch();

  return (
    <>
      {currentStoryInd === index && (
        <ReactInstaStories
          key={story.id.id}
          isPaused={story.id !== selectedStory.id}
          preventDefault={true}
          preloadCount={2}
          currentIndex={GetUnviewedStory(story)}
          onPrevious={() => {
            if (currentStoryId > 0) setCurrentStoryId(currentStoryId - 1);
            else {
              dispatch(setPreviousStory(story.id));
            }
          }}
          onNext={() => {
            if (currentStoryId < story.stories.length - 1)
              setCurrentStoryId(currentStoryId + 1);
            else {
              dispatch(setNextStory(story.id));
            }
          }}
          stories={configureStory(story)?.stories}
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
              setCurrentStoryId(0);
              dispatch(setNextStory(selectedStory.id));
            }, 10);
          }}
          onStoryEnd={() => {
            if (currentStoryId < story.stories.length - 1)
              setCurrentStoryId(currentStoryId + 1);
            else {
              dispatch(setNextStory(story.id));
            }
          }}
        />
      )}
    </>
  );
}

export default StoriesLists;
