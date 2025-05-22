import { useEffect, useState } from "react";

import Loader from "components/global/Loader";
import { setNextStory, setPreviousStory } from "store/homepage/actions";
import { StoryType } from "models/story";
import ReactInstaStories from "utils/react-insta-stories-master/src";
import { Sendevent } from "utils/functions";
import { useAppStore } from "store";
import { GA_CLICK_EVENT_VALUES, GA_EVENT_NAMES } from "utils/GAEvents";

interface Props {
  story: StoryType;
  active: boolean;
  isPaused: boolean;
}
function StoryHolder({ story, active, isPaused }: Props) {
  const { selectedStory } = useAppStore();

  const [currentStoryId, setCurrentStoryId] = useState(0);

  useEffect(() => {
    if (selectedStory.id === story.id) {
      setCurrentStoryId(0);
    } else {
      setCurrentStoryId(0);
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
            isPaused={!active}
            preloadCount={1}
            loader={<Loader style={{}} />}
            currentIndex={0}
            onPrevious={() => {
              Sendevent({
                event: GA_EVENT_NAMES.CLICK,
                value: GA_CLICK_EVENT_VALUES.CHANGE_STORY_IN_STORYSCREEN_EVENT,
              });
              if (active) {
                if (currentStoryId > 0) {
                  setCurrentStoryId(currentStoryId - 1);
                } else {
                  setPreviousStory(story.id);
                }
              }
            }}
            onNext={() => {
              Sendevent({
                event: GA_EVENT_NAMES.CLICK,
                value: GA_CLICK_EVENT_VALUES.CHANGE_STORY_IN_STORYSCREEN_EVENT,
              });
              if (active) {
                if (currentStoryId < story.stories.length - 1) {
                  setCurrentStoryId(currentStoryId + 1);
                } else {
                  setNextStory(story.id);
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

                  setNextStory(story.id);
                }
              }, 10);
            }}
            onStoryEnd={() => {}}
          />
        }
      </div>
    </>
  );
}

export default StoryHolder;
