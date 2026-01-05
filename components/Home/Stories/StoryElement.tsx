import StoryAvatar from "./StoryAvatar";
import Story from "./Story";
import profilePicture from "public/images/profileNo.png";
import { GetUnviewedStory } from "store/homepage/actions";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { StoryElementPropsType } from "models/componentType/StoryElementPropsType";

function StoryElement({ index, story, userData }: StoryElementPropsType) {
  if (String(userData?.id) === String(story?.id))
    return (
      <div className="min-w-[100px] relative w-[100px] h-[150px] rounded-[20px] flex">
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
          media={
            story.stories.filter((s) => s.is_seen === false)?.[0] ??
            story.stories[story.stories?.length - 1]
          }
          Name={story.name ?? story.mobile_phone ?? "Unknown"}
          story={story}
        />
      </div>
    );
  else
    return (
      <div className="relative w-[100px] h-[150px] rounded-[20px] flex">
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
