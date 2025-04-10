import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";

import { GetUnviewedStory } from "store/homepage/actions";
import StoryServiceClass from "services/story";

function StoryElement({ index, story, select }) {
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
        onClick={() => select(StoryServiceClass.configureStory(story))}
      />
    </div>
  );
}

export default StoryElement;
