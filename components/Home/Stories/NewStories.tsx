"use client";
import "styles/stories.css";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cube from "react-cube-navigation";
import { SelectStory } from "store/homepage/actions";
import { configureStory } from "utils/functions";
import StoryHolder from "./StoryHolder";
import { useSwipeable } from "react-swipeable";

function StoriesContainer({ activeId, selectedStory }) {
  const storiesData = useSelector(
    (state: StateInterface) => state.homepage.storiesData
  );
  const dispatch = useDispatch();
  var dir = 0;
  const [isTop, setIsTop] = useState("");

  const handlers = useSwipeable({
    onTouchStartOrOnMouseDown: (e) => {
      dir = 0;

      document.querySelector<HTMLDivElement>(".fixed-layout").style.transition =
        "0s";
    },
    onSwiping: (e) => {
      if (e.dir === "Down") {
        dir = (e.deltaY * 100) / window.innerHeight;

        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${dir}%)`;
        if (!isTop) setIsTop(e.dir);
      }
    },
    onTouchEndOrOnMouseUp: (e) => {
      if (Math.abs(dir) > 5) {
        if (isTop) {
          if (dir > 20) {
            document.querySelector<HTMLDivElement>(
              ".fixed-layout"
            ).style.transition = "0.3s";
            document.querySelector<HTMLDivElement>(
              ".fixed-layout"
            ).style.transform = `translateY(${100}%)`;

            setTimeout(() => {
              dispatch(SelectStory(null));
            }, 150);
          } else {
            document.querySelector<HTMLDivElement>(
              ".fixed-layout"
            ).style.transition = "0.3s";
            document.querySelector<HTMLDivElement>(
              ".fixed-layout"
            ).style.transform = `translateY(${0}%)`;
          }
        }
        dir = 0;
      }
      setIsTop("");
    },

    delta: 10,
    trackMouse: true,
    trackTouch: true,

    touchEventOptions: {
      passive: false,
    },
  });
  return (
    <div
      className="fixed-layout"
      {...handlers}
      onPointerLeave={() => {
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${0}%)`;
      }}
      onMouseLeave={() => {
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${0}%)`;
      }}
      style={{
        height: `${window.visualViewport.height}px`,
      }}
    >
      <Cube
        index={storiesData.findIndex((s) => s.id === selectedStory?.id)}
        onChange={(i) => {
          if (
            Math.abs(
              storiesData.findIndex((s) => s.id === selectedStory?.id) - i
            ) === 1 &&
            i > -1
          ) {
            dispatch(SelectStory(storiesData[i]));
          }
        }}
        width={window.innerWidth}
        lockScrolling
        scaleRange={[1, 1]}
        height={window.innerHeight - 100}
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
