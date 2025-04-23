"use client";
import { useState, useRef, useEffect } from "react";
import { errorPNG } from "utils/AxiosApi";
import Loader from "components/global/Loader";
import Image from "next/image";
import StoryServiceClass from "services/story";
import { Story as StoryType } from "models/story";
import { SelectStory } from "store/homepage/actions";

function Story({
  media,
  Name,
  index,
  story,
}: {
  media: { photo_path: string; full_video_path: string; id: number };
  Name: string;
  index: number;
  story: StoryType;
}) {
  const setSelectStory = (e: StoryType) => {
    SelectStory(e);
  };

  const [load, onLoad] = useState(null);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current) {
      if (ref?.current?.complete) {
        onLoad("loaded");
      }
    }
  }, [ref]);
  return (
    <div
      className="story-element-item"
      onClick={() => setSelectStory(StoryServiceClass.configureStory(story))}
      data-cy="story-element"
    >
      <div className="linear-g-image" />
      <div className="story-text overflow-hidden">{Name}</div>
      {<Loader style={{ display: load ? "none" : "flex" }} />}
      <div className="" style={{ display: !load ? "none" : "flex" }}>
        <Image
          className="thumb-img"
          alt="story"
          onLoad={(e) => {
            onLoad("loaded");
          }}
          width={100}
          ref={ref}
          height={160}
          priority={true}
          loading="eager"
          onError={(e) => {
            e.currentTarget.src = errorPNG;
            e.currentTarget.onerror = null;
          }}
          unoptimized
          src={StoryServiceClass.getThumb(
            media.full_video_path || media.photo_path,
            media.full_video_path
          )}
        />
      </div>
    </div>
  );
}

export default Story;
