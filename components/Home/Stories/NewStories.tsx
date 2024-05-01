import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cube from "react-cube-navigation";
import {
  GetUnviewedStory,
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import { configureStory } from "utils/functions";
import StoryHolder from "./StoryHolder";
import { useSwipeable } from "react-swipeable";

function StoriesContainer({ activeId, selectedStory }) {
  const storiesData = useSelector((state: any) => state.homepage.storiesData);
  const [index, setIndex] = useState(
    storiesData.findIndex((s) => s.id === selectedStory?.id)
  );
  const [currentStoryId, setCurrentStoryId] = useState(0);
  const dispatch = useDispatch();
  useEffect(() => {
    setIndex(storiesData.findIndex((s) => s.id === selectedStory?.id));
  }, [selectedStory]);
  const handlers = useSwipeable({
    onSwipedUp: () => {
      dispatch(SelectStory(null));
    },
    trackMouse: true,
  });
  return (
    <div className="fixed-layout" {...handlers}>
      <Cube
        index={index}
        onChange={(i) => {
          setIndex(i);
          console.log(i);
          dispatch(SelectStory(storiesData[i]));
        }}
        width={window.innerWidth}
        height={window.innerHeight}
        hasNext={(i) => i < storiesData.length - 1}
        enableGestures
        renderItem={(i, active) => {
          return (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                backgroundColor: "#000",
              }}
            >
              {i > -1 && i < storiesData.length && (
                <StoryHolder
                  active={selectedStory.id === storiesData[i]?.id}
                  isPaused={active}
                  currentStoryId={currentStoryId}
                  setCurrentStoryId={(e) => setCurrentStoryId(e)}
                  story={configureStory(storiesData[i])}
                />
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

export default StoriesContainer;
