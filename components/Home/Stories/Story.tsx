"use client";

import StoryServiceClass from "services/story";

import { SelectStory } from "store/homepage/actions";

import StoryCard from "./StoryCard";

function Story({ media, Name, index, story }) {
  const setSelectStory = (e: any) => {
    SelectStory(e);
  };
  return (
    <div
      className="shadow-[0_3px_6px_rgba(0,0,0,0.2)] rounded-[20px]"
      onClick={() => setSelectStory(StoryServiceClass.configureStory(story))}
      data-pw="story-element"
    >
      <StoryCard
        key={media?.full_video_path || media?.photo_path}
        Name={Name}
        media={media?.full_video_path || media?.photo_path}
        isVideo={media.full_video_path}
      />
    </div>
  );
}

export default Story;
