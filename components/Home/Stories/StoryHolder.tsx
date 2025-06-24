import { useEffect, useState } from "react";

import TransParentLoader from "components/global/TransParentLoader";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import StoryViewer from "./StoryViewer";

import { useAppStore } from "store";

import StoryServiceClass from "services/story";

import { StoryHolderPropsType } from "models/componentType/StoryHolderPropsType";
import Xicon from "public/svg/Xicon.svg";
function StoryHolder({ story, active, isPaused }: StoryHolderPropsType) {
  const { selectedStory } = useAppStore();

  const [currentStoryId, setCurrentStoryId] = useState(0);

  useEffect(() => {
    if (selectedStory.id === story.id) {
      setCurrentStoryId(0);
    }
  }, [selectedStory, story.id]);

  return (
    <div
      className="story-holder"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {active && (
        <span
          className="z-[99] top-[30px] right-[20px] absolute cursor-pointer"
          onClick={() => {
            SelectStory(null);
          }}
        >
          {<Xicon className="[&>path]:fill-[#fafafa]" />}
        </span>
      )}
      <StoryViewer
        activeId={selectedStory.id}
        id={story.id}
        key={`${story.id}-${currentStoryId}`}
        isPaused={!active}
        preloadCount={0}
        onStoryStart={(e) => {
          if (active && story?.stories?.[e]) {
            const s: any = story.stories[e];
            if (s?.id) {
              StoryServiceClass.WatchStory(s.id, story.id as any);
            }
          }
        }}
        loader={<TransParentLoader />}
        currentIndex={currentStoryId}
        onPrevious={() => {
          if (active) {
            if (currentStoryId > 0) {
              setCurrentStoryId(currentStoryId - 1);
            } else {
              setPreviousStory(story.id);
            }
          }
        }}
        onNext={() => {
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
          width: "100vw",
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
          if (active) {
            setCurrentStoryId(0);
            setNextStory(story.id);
          }
        }}
        onStoryEnd={() => {}}
      />
    </div>
  );
}

export default StoryHolder;
