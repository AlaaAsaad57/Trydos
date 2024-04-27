import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";
import { configureStory } from "utils/functions";
import { GetUnviewedStory } from "store/homepage/actions";
import { StoryType } from "models/story";

function StoryElement({
  index,
  story,
  select,
}: {
  index: number;
  story: StoryType;
  select: Function;
}) {
  return (
    <div className="story-element-container">
      <StoryAvatar
        isSeen={story.stories.filter((s) => s.is_seen === false).length === 0}
        avatar={story.photo_path ?? profilePicture}
      />
      <Story
        index={1}
        media={story.stories[GetUnviewedStory(story)]}
        Name={story.name ?? story.mobile_phone ?? "Unknown"}
        onClick={() => select(configureStory(story))}
      />
    </div>
  );
}

export default StoryElement;
