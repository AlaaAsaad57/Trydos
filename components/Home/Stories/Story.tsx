"use client";

import { errorPNG } from "utils/AxiosApi";
import Image from "next/image";
import StoryServiceClass from "services/story";
import { FixedStory as StoryType } from "models/Genaral/Story";
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

  return (
    <div
      className="story-element-item"
      onClick={() => setSelectStory(StoryServiceClass.configureStory(story))}
      data-cy="story-element"
    >
      <div className="linear-g-image" />
      <div className="story-text overflow-hidden">{Name}</div>

      <div className="" style={{ display: "flex" }}>
        <Image
          className="thumb-img object-cover object-center"
          alt="story"
          width={100}
          height={160}
          priority={true}
          loading="eager"
          onError={(e) => {
            e.currentTarget.src = errorPNG;
            e.currentTarget.onerror = null;
          }}
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
