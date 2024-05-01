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

  const dispatch = useDispatch();

  const handlers = useSwipeable({
    onSwipedUp: () => {
      dispatch(SelectStory(null));
    },
    trackMouse: true,
  });
  return (
    <div className="fixed-layout" {...handlers}>
      <Cube
        index={storiesData.findIndex((s) => s.id === selectedStory?.id)}
        onChange={(i) => {
          dispatch(SelectStory(storiesData[i]));
        }}
        width={window.innerWidth}
        lockScrolling
        height={window.innerHeight}
        hasNext={(i) => i < storiesData.length - 1}
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
