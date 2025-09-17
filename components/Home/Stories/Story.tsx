"use client";

import StoryServiceClass from "services/story";
import { FixedStory as StoryType } from "models/Genaral/Story";
import { SelectStory } from "store/homepage/actions";
import { StoryPropsType } from "models/componentType/StoryPropsType";
import StoryCard from "./StoryCard";

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
      <StoryCard
        Name={Name}
        media={media?.full_video_path || media?.photo_path}
        isVideo={media.full_video_path}
      />
    </div>
  );
}

export default Story;
