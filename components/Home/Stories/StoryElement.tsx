import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";
import { configureStory } from "utils/functions";
import { GetUnviewedStory } from "store/homepage/actions";

function StoryElement({
  index,
  story,
  viewedStory,
  select,
}: {
  index: number;
  story: any;
  viewedStory: any;
  select: any;
}) {
  return (
    <div className="story-element-container">
      <StoryAvatar avatar={story.photo_path ?? profilePicture} />
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
