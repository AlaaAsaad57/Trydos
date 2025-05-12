import Image, { StaticImageData } from "next/image";
function StoryAvatar({
  avatar,
  isSeen,
}: {
  avatar: string | StaticImageData;
  isSeen: boolean;
}) {
  return (
    <div className={`story-avatar ${isSeen && "is-seen-story"}`}>
      {avatar && (
        <Image
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
