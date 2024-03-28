import Image, { StaticImageData } from "next/image";
function StoryAvatar({ avatar }: { avatar: string | StaticImageData }) {
  return (
    <div className="story-avatar">
      {avatar && (
        <Image loading="eager" src={avatar} alt="user" width={28} height={28} />
      )}
    </div>
  );
}

export default StoryAvatar;
