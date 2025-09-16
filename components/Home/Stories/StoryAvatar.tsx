import { StoryAvatarPropsType } from "models/componentType/StoryAvatarPropsType";
import Image, { StaticImageData } from "next/image";
function StoryAvatar({ avatar, isSeen }: StoryAvatarPropsType) {
  return (
    <div
      className={`rounded-full justify-center items-center  absolute top-[-5px] left-[-8px] w-[30px] h-[30px] bg-[#ffab62] flex z-[10] ${
        isSeen && "bg-white"
      }`}
    >
      {avatar && (
        <Image
          className="w-[28px] h-[28px]  object-top object-cover rounded-full justify-center items-center"
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
