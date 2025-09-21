import Image from "next/image";

import { getConfiguredImage, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import NextLink from "components/global/NextLink";
import { GetImageUrl } from "utils/tinyUtils";

interface MoreOfferAvatarProps {
  images: string;
  zIndex: number;
  viewed: number;
  priority: boolean;
  boutique: any;
  href: string;
}
function MoreOfferAvatar({
  images,
  zIndex,
  viewed,
  priority,
  boutique,
  href,
}: MoreOfferAvatarProps) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const { language } = useAppStore();

  return (
    <NextLink
      href={href}
      data={{
        is_boutique: true,
        href: href,
        ...boutique,
      }}
      className="offer-avatar hasMore w-[40px] h-[40px] rounded-full cursor-pointer duration-300 bg-white bottom-0 relative flex"
      style={{ zIndex: zIndex, transform: `translateX(-${viewed * 5}px)` }}
    >
      <div className="offer-more-s  w-[40px] h-[40px] rounded-full" />
      <span className="z-40 text-[10px] regular text-white flex items-center justify-center w-full h-full">
        {translate("More", language)}
      </span>
      <Image
        loading="eager"
        src={getConfiguredImage({ src: GetImageUrl(images), height: 50 })}
        className="absolute"
        priority={priority}
        fetchPriority="auto"
        alt="avatar"
        width={40}
        height={40}
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </NextLink>
  );
}

export default MoreOfferAvatar;
