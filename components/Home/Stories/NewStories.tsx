"use client";
import "styles/stories.css";
import React, { useEffect, useState } from "react";
import Cube from "./CubeCarousel";
import { SelectStory } from "store/homepage/actions";
import { useSwipeable } from "react-swipeable";
import StoryServiceClass from "services/story";
import StoryHolder from "./StoryHolder";
import { useAppStore } from "store";
import Spinner from "components/global/Spinner";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import SearchParamUpdater from "components/global/ParamsUpdater";

function StoriesContainer({ selectedStory, stories }: any) {
  const { storiesData: storiesCache } = useAppStore();
  let storiesData = (stories?.length > 0 && stories) || storiesCache || [];
  var dir = 0;
  const [isTop, setIsTop] = useState("");

  // Maintain cube index locally to avoid weird jumps coming from
  // uncontrolled updates of `selectedStory` during animation.

  const initialIndex =
    storiesData?.findIndex((s) => s.id === selectedStory?.id) ?? 0;
  const [cubeIndex, setCubeIndex] = useState<number>(initialIndex);

  // Keep cube index in sync when selectedStory changes externally (e.g. via prev/next from StoryViewer).
  useEffect(() => {
    const idx = storiesData?.findIndex((s) => s.id === selectedStory?.id) ?? 0;
    if (idx !== cubeIndex) {
      setCubeIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStory]);

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
          ".fixed-layout",
        ).style.transform = `translateY(${dir}%)`;
        if (!isTop) setIsTop(e.dir);
      }
    },
    onTouchEndOrOnMouseUp: (e) => {
      if (Math.abs(dir) > 5) {
        if (isTop) {
          if (dir > 20) {
            document.querySelector<HTMLDivElement>(
              ".fixed-layout",
            ).style.transition = "0.3s";
            document.querySelector<HTMLDivElement>(
              ".fixed-layout",
            ).style.transform = `translateY(${100}%)`;

            setTimeout(() => {
              SelectStory(null);
            }, 150);
          } else {
            document.querySelector<HTMLDivElement>(
              ".fixed-layout",
            ).style.transition = "0.3s";
            document.querySelector<HTMLDivElement>(
              ".fixed-layout",
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
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.STORY_SCREEN,
        screen_path: window.location.pathname,
      },
    });
  }, []);

  if (
    !storiesData ||
    storiesData?.length === 0 ||
    !storiesData?.find((s) => s.id === selectedStory.id)
  )
    return (
      <div className="bg-white rounded-lg w-[300px] h-[400px] flex-row p-4 fixed z-99999999 justify-center items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="scale-[4]">
          <Spinner />
        </span>
      </div>
    );
  return (
    <div
      className="fixed-layout fixed top-0 left-0 w-screen h-full max-w-full max-h-full bg-black flex items-center justify-center z-999999999999999"
      {...handlers}
      onPointerLeave={() => {
        document.querySelector<HTMLDivElement>(
          ".fixed-layout",
        ).style.transform = `translateY(${0}%)`;
      }}
      onMouseLeave={() => {
        document.querySelector<HTMLDivElement>(
          ".fixed-layout",
        ).style.transform = `translateY(${0}%)`;
      }}
      style={{
        height: `${window.visualViewport.height}px`,
      }}
    >
      <SearchParamUpdater searchKey="stories" searchValue="true" />
      <Cube
        index={cubeIndex}
        enableGestures={isTop !== "Down"}
        onChange={(i) => {
          if (i > -1 && i < storiesData.length) {
            setCubeIndex(i);
            SelectStory(storiesData[i]);
          }
        }}
        width={window.innerWidth}
        lockScrolling
        scaleRange={[1, 1]}
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
                <>
                  {
                    <StoryHolder
                      active={i === cubeIndex}
                      isPaused={i !== cubeIndex}
                      story={StoryServiceClass.configureStory(storiesData[i])}
                    />
                  }
                </>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

export default StoriesContainer;
