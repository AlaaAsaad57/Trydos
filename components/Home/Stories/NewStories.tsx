import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cube from "react-cube-navigation";
import { SelectStory } from "store/homepage/actions";
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
  const [isTop, setIsTop] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === "Up") {
        dir -= 7;
        document.querySelector<HTMLDivElement>(
          ".fixed-layout"
        ).style.transform = `translateY(${dir}px)`;
        console.log(dir);
        if (!isTop) setIsTop(true);
      }
    },
    onTouchEndOrOnMouseUp: (e) => {
      if (Math.abs(dir) > 20) {
        if (isTop) {
          console.log("closed");
          dispatch(SelectStory(null));
        }
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
      setIsTop(false);
    },
    delta: 0,
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
            console.log(i);
            dispatch(SelectStory(storiesData[i]));
            console.log("cube-changed", i);
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
