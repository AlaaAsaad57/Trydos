import NextLink from "Hooks/NextLink";
import Image from "next/image";
import Link from "next/link";
interface OfferAvatarProps {
  images: string;
  zIndex: number;
  name: string;
  category: string | number;
  linkUrl: string;
}
function OfferAvatar({
  images,
  zIndex,
  name,
  category,
  linkUrl,
}: OfferAvatarProps) {
  const getImageCld = () => {
    if (images.includes("cloudinary")) {
      return images.replace("/upload", "/upload/h_100/f_avif/q_100");
    } else return images;
  };
  return (
    <NextLink
      href={`${linkUrl}`}
      className="offer-avatar"
      style={{
        zIndex: zIndex,
        transform: `translateX(-${(zIndex - 1) * 5}px)`,
      }}
      prefetch={false}
    >
      <div className="offer-avatar-info">
        <span>{name}</span>
        <span>{category}</span>
      </div>
      <div className="offer-avatr-inner-s" />
      <Image
        loading="eager"
        src={getImageCld()}
        priority={true}
        alt="avatar"
        quality={60}
        width={40}
        height={40}
        unoptimized
        unselectable="on"
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </NextLink>
  );
}

export default OfferAvatar;
