import * as React from "react";
import Spinner from "../components/Spinner";
import { Renderer, Tester } from "./../interfaces";
import WithHeader from "./wrappers/withHeader";
import WithSeeMore from "./wrappers/withSeeMore";

export const renderer: Renderer = ({
  story,
  action,
  isPaused,
  config,
  activeId,
  id,
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const { width, height, loader, storyStyles } = config;
  const imgRef = React.useRef<HTMLImageElement>(null);
  let computedStyles = {
    ...styles.storyContent,
    ...(storyStyles || {}),
  };

  React.useEffect(() => {
    setLoaded(false);
    action("pause", true);
  }, [story.url]);

  const imageLoaded = () => {
    setLoaded(true);
    if (activeId === id) action("play");
  };

  React.useEffect(() => {
    if (imgRef?.current?.complete) {
      imageLoaded();
    } else {
      action("pause", true);
    }
  }, [isPaused]);

  return (
    <WithHeader {...{ story, globalHeader: config.header }}>
      <WithSeeMore {...{ story, action }}>
        <div style={{ position: "relative", width, height }}>
          <img
            style={{
              ...computedStyles,
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
            }}
            src={story.url}
            onWaiting={() => action("pause", true)}
            ref={imgRef}
            onLoad={imageLoaded}
            onLoadStart={() => action("pause", true)}
          />
          {!loaded && (
            <div
              style={{
                width: width,
                height: height,
                position: "absolute",
                left: 0,
                top: 0,
                background: "rgba(0, 0, 0, 0.9)",
                zIndex: 9,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#ccc",
              }}
            >
              {loader || <Spinner />}
            </div>
          )}
        </div>
      </WithSeeMore>
    </WithHeader>
  );
};

const styles = {
  story: {
    display: "flex",
    position: "relative",
    overflow: "hidden",
  },
  storyContent: {
    width: "auto",
    maxWidth: "100%",
    maxHeight: "100%",
    margin: "auto",
  },
};

export const tester: Tester = (story) => {
  return {
    condition: !story.content && (!story.type || story.type === "image"),
    priority: 2,
  };
};

export default {
  renderer,
  tester,
};
