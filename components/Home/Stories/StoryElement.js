import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";
import { configureStory } from "utils/functions";
import { GetUnviewedStory } from "store/homepage/actions";

function StoryElement({ index, story, viewedStory, select }) {
  return (
    <div className="story-element-container">
      <StoryAvatar avatar={story.photo_path ?? profilePicture} />
      <Story
        media={story.stories[GetUnviewedStory(story)]}
        Name={story.name ?? story.mobile_phone ?? "Unknown"}
        onClick={() => select(configureStory(story))}
      />
    </div>
  );
}

export default StoryElement;
