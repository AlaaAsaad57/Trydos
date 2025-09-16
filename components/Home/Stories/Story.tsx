"use client";

import pngErr from "public/images/error.png";
import Image from "next/image";
import StoryServiceClass from "services/story";
import { FixedStory as StoryType } from "models/Genaral/Story";
import { SelectStory } from "store/homepage/actions";
import { StoryPropsType } from "models/componentType/StoryPropsType";

function Story({ media, Name, index, story }: StoryPropsType) {
  const setSelectStory = (e: StoryType) => {
    SelectStory(e);
  };

  return (
    <div
      className="shadow-[0_3px_6px_rgba(0,0,0,0.2)] rounded-[20px]"
      onClick={() => setSelectStory(StoryServiceClass.configureStory(story))}
      data-cy="story-element"
    >
      <div className="absolute top-0 left-0 w-[100px] h-[150px] rounded-[20px] z-[5] bg-[linear-gradient(180deg,#00000000_0%,#000_181%)]" />
      <div className="absolute bottom-[2px] left-0 right-0 mx-auto w-[81px] block text-center text-[12px] regular text-white z-[12] whitespace-nowrap  text-ellipsis tracking-[0.003em]  items-center justify-center overflow-hidden">
        {Name}
      </div>

      <div
        className="relative w-[100px] h-[150px] rounded-[20px] flex"
        style={{ display: "flex" }}
      >
        <Image
          className="thumb-img object-cover object-center flex w-[100px] h-[150px] rounded-[20px] z-[2]"
          alt="story"
          width={100}
          height={160}
          priority={true}
          loading="eager"
          onError={(e) => {
            e.currentTarget.src = pngErr.src;
            e.currentTarget.onerror = null;
          }}
          src={StoryServiceClass.getThumb(
            media?.full_video_path || media?.photo_path,
            media?.full_video_path
          )}
        />
      </div>
    </div>
  );
}

export default Story;
