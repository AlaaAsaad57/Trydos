import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";

import { GetUnviewedStory } from "store/homepage/actions";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

function StoryElement({ index, story }) {
  return (
    <div className="story-element-container">
      <StoryAvatar
        isSeen={story.stories.filter((s) => s.is_seen === false).length === 0}
        avatar={
          typeof story.photo_path === "string"
            ? getConfiguredImage({
                src: story.photo_path
                  ? GetImageUrl(story.photo_path)
                  : profilePicture.src,
                width: 20,
                height: 20,
              })
            : profilePicture
        }
      />
      <Story
        index={1}
        media={story.stories[GetUnviewedStory(story)]}
        Name={story.name ?? story.mobile_phone ?? "Unknown"}
        story={story}
      />
    </div>
  );
}

export default StoryElement;
