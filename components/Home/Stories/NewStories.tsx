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
  var dir = 0;
  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === "Up") {
        dir -= 10;
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${dir}px)`;
      }
      if (e.dir === "Down") {
        if (dir < 0) {
          dir += 10;
          document.querySelector<HTMLDivElement>(
            ".fixed-layout"
          ).style.transform = `translateY(${dir}px)`;
        }
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (Math.abs(dir) > 50) {
        dispatch(SelectStory(null));
        dir = 0;
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${0}px)`;
      } else {
        dir = 0;
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${0}px)`;
      }
    },
    trackMouse: true,
    delta: 3,
  });
  return (
    <div
      className="fixed-layout"
      {...handlers}
      style={{
        height: `${window.visualViewport.height}px`,
      }}
    >
      <Cube
        index={storiesData.findIndex((s) => s.id === selectedStory?.id)}
        onChange={(i) => {
          console.log(i);
          dispatch(SelectStory(storiesData[i]));
        }}
        width={window.innerWidth}
        enableGestures
        height={window.visualViewport.height - 100}
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
