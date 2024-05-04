import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "components/global/Loader";
import { setNextStory, setPreviousStory } from "store/homepage/actions";
import { StoryType } from "models/story";
import ReactInstaStories from "utils/libs/react-insta-stories-master/src";

interface Props {
  story: StoryType;
  active: boolean;
  isPaused: boolean;
}
function StoryHolder({ story, active, isPaused }: Props) {
  const dispatch = useDispatch();
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const [currentStoryId, setCurrentStoryId] = useState(0);
  const [paused, setIsPaused] = useState(true);
  useEffect(() => {
    if (selectedStory.id === story.id) {
      setCurrentStoryId(0);
      setIsPaused(false);
    } else {
      setCurrentStoryId(0);
      setIsPaused(true);
    }
  }, [selectedStory]);
  useEffect(() => {}, []);
  return (
    <>
      <div className="story-holder">
        {
          <ReactInstaStories
            activeId={selectedStory.id}
            id={story.id}
            key={story.id}
            isPaused={isPaused || !active}
            preloadCount={1}
            loader={<Loader style={{}} />}
            currentIndex={0}
            onPrevious={() => {
              if (active) {
                if (currentStoryId > 0) {
                  console.log("story-prev-image", story.id, currentStoryId);
                  setCurrentStoryId(currentStoryId - 1);
                } else {
                  console.log("story-prev", story.id);
                  dispatch(setPreviousStory(story.id));
                }
              }
            }}
            onNext={() => {
              if (active) {
                if (currentStoryId < story.stories.length) {
                  console.log("story-next-image", story.id, currentStoryId);
                  setCurrentStoryId(currentStoryId + 1);
                } else {
                  console.log("story-next", story.id);
                  dispatch(setNextStory(story.id));
                }
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
                  console.log("allstories-end-story-next", story.id);
                  dispatch(setNextStory(story.id));
                }
              }, 10);
            }}
            onStoryEnd={() => {
              if (active) {
                if (currentStoryId < story.stories.length - 1) {
                  console.log(
                    "story-end-story-next-image",
                    story.id,
                    currentStoryId
                  );

                  setCurrentStoryId(currentStoryId + 1);
                } else {
                  // dispatch(setNextStory(story.id));
                }
              }
            }}
          />
        }
      </div>
    </>
  );
}

export default StoryHolder;
