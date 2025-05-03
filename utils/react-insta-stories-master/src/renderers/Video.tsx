import * as React from "react";
import Spinner from "../components/Spinner";
import { Renderer, Tester } from "./../interfaces";
import WithHeader from "./wrappers/withHeader";
import WithSeeMore from "./wrappers/withSeeMore";
import { SelectStory } from "../../../../store/homepage/actions";
import XIcon from "../../../../public/svg/Xicon.svg";
export const renderer: Renderer = ({
  story,
  action,
  isPaused,
  config,
  messageHandler,
  activeId,
  id,
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const { width, height, loader, storyStyles } = config;

  let computedStyles = {
    ...styles.storyContent,
    ...(storyStyles || {}),
  };

  let vid = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (vid.current) {
      if (isPaused) {
        vid.current.pause();
      } else {
        vid.current.play().catch(() => {});
      }
    }
  }, [isPaused]);
  React.useEffect(() => {
    if (vid.current) {
      if (activeId !== id) {
        vid.current.pause();
        vid.current.currentTime = 0;
      }
    }
  }, [activeId]);
  const onWaiting = () => {
    action("pause", true);
  };

  const onPlaying = () => {
    action("play", true);
  };

  const videoLoaded = () => {
    messageHandler("UPDATE_VIDEO_DURATION", { duration: vid.current.duration });
    setLoaded(true);
    vid.current
      .play()
      .then(() => {
        action("play");
      })
      .catch(() => {
        setMuted(true);
        vid.current.play().finally(() => {
          action("play");
        });
      });
  };

  return (
    <WithHeader {...{ story, globalHeader: config.header }}>
      <WithSeeMore {...{ story, action }}>
        <div style={styles.videoContainer} className="">
          <div
            className="absolute cursor-pointer z-[999999999] top-[50px]  right-[30px] text-white text-center text-lg regular"
            onClick={() => {
              SelectStory(null);
            }}
          >
            <XIcon className="[&>path]:fill-[#D3D3D3] shadow-md" />
          </div>
          {story?.link && (
            <a
              className="absolute z-[999999999]  bottom-[70px] mx-auto left-0 right-0 text-white text-center text-lg regular underline"
              href={story.link}
              target="_self"
              onClick={() => {
                SelectStory(null);
              }}
            >
              {story.link}
            </a>
          )}
          <video
            ref={vid}
            style={computedStyles}
            src={story.url}
            controls={false}
            onLoadedData={videoLoaded}
            playsInline
            onWaiting={onWaiting}
            onPlaying={onPlaying}
            muted={activeId !== id}
            autoPlay={true}
            webkit-playsinline="true"
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
  storyContent: {
    width: "auto",
    maxWidth: "100%",
    maxHeight: "100%",
    margin: "auto",
  },
  videoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export const tester: Tester = (story) => {
  return {
    condition: story.type === "video",
    priority: 2,
  };
};

export default {
  renderer,
  tester,
};
