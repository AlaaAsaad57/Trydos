import Image from "next/image";

import { translate } from "utils/functions";
import { useSelector } from "react-redux";
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
  const language: string = useSelector((state: any) => state.homepage.language);

  return (
    <div
      className="offer-avatar hasMore"
      style={{ zIndex: zIndex, transform: `translateX(-${viewed * 5}px)` }}
    >
      <div className="offer-more-s" />
      <span>{translate("More", language)}</span>
      <Image
        loading="eager"
        src={images}
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
