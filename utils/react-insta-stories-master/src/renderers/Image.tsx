import * as React from "react";
import Spinner from "../components/Spinner";
import { Renderer, Tester } from "./../interfaces";
import WithHeader from "./wrappers/withHeader";
import WithSeeMore from "./wrappers/withSeeMore";
import { SelectStory } from "../../../../store/homepage/actions";
import XIcon from "../../../../public/svg/Xicon.svg";
import Image from "next/image";
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
          <div
            className="absolute cursor-pointer z-[999999999] top-[70px]  right-[30px] text-white text-center text-lg regular"
            onClick={() => {
              SelectStory(null);
            }}
          >
            <XIcon className="[&>path]:fill-[#D3D3D3]" />
          </div>
          {story?.link && (
            <a
              className="absolute w-full flex items-center justify-center bg-[#00000026] z-[999999999] bottom-[70px] mx-auto left-0 right-0 text-white text-center text-lg regular underline"
              href={story.link}
              target="_self"
              onClick={() => {
                SelectStory(null);
              }}
            >
              {story.link}
            </a>
          )}
          <Image
            width={820}
            height={1000}
            alt="stories"
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
