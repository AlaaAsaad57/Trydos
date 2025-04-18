import Image from "next/image";

import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

interface MoreOfferAvatarProps {
  images: string;
  zIndex: number;
  viewed: number;
  priority: boolean;
}
function MoreOfferAvatar({
  images,
  zIndex,
  viewed,
  priority,
}: MoreOfferAvatarProps) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const { language } = useAppStore();

  return (
    <div
      className="offer-avatar hasMore"
      style={{ zIndex: zIndex, transform: `translateX(-${viewed * 5}px)` }}
    >
      <div className="offer-more-s" />
      <span className="z-40 text-[10px] regular text-white flex items-center justify-center w-full h-full">
        {translate("More", language)}
      </span>
      <Image
        loading="eager"
        src={images}
        className="absolute"
        priority={priority}
        fetchPriority={priority ? "high" : "low"}
        alt="avatar"
        width={40}
        height={40}
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </div>
  );
}

export default MoreOfferAvatar;
