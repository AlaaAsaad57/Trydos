import Image from "next/image";
import { useRouter } from "next/navigation";
import NextLink from "components/global/NextLink";
import { Boutique } from "models/Genaral/Boutique";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";

interface OfferAvatarProps {
  images: string;
  zIndex: number;
  name: string;
  category: string | number;
  linkUrl: string;
  priority: boolean;
  boutique: Boutique;
}
function OfferAvatar({
  images,
  zIndex,
  name,
  category,
  priority,
  linkUrl,
  boutique,
}: OfferAvatarProps) {
  const router = useRouter();

  return (
    <NextLink
      data={{
        is_boutique: true,
        ...boutique,
        href: linkUrl,
      }}
      href={linkUrl}
      aria-label={`Go To listing boutique ${name} ${category}`}
      className="offer-avatar"
      style={{
        zIndex: zIndex,
        transform: `translateX(-${(zIndex - 1) * 5}px)`,
      }}
    >
      <div className="offer-avatar-info">
        <span>{name}</span>
        <span>{category}</span>
      </div>
      <div className="offer-avatr-inner-s w-full h-full" />
      <Image
        loading="eager"
        src={getConfiguredImage({
          src: GetImageUrl(images),
          width: 40,
          height: 40,
        })}
        priority={priority}
        alt="avatar"
        quality={100}
        width={40}
        height={40}
        unselectable="on"
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </NextLink>
  );
}

export default OfferAvatar;
