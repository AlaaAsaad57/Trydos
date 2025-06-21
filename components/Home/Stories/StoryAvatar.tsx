import { StoryAvatarPropsType } from "models/componentType/StoryAvatarPropsType";
import Image, { StaticImageData } from "next/image";
function StoryAvatar({
  avatar,
  isSeen,
}: StoryAvatarPropsType) {
  return (
    <div className={`story-avatar ${isSeen && "is-seen-story"}`}>
      {avatar && (
        <Image
          className="object-cover"
          quality={90}
          loading="eager"
          src={avatar}
          alt="user"
          width={28}
          height={28}
        />
      )}
    </div>
  );
}

export default StoryAvatar;
