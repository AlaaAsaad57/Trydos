import Image from "next/image";
import NextLink from "components/global/NextLink";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";
import { OfferAvatarPropsType } from "models/componentType/OfferAvatarPropsType";

function OfferAvatar({
  images,
  zIndex,
  name,
  category,
  priority,
  linkUrl,
  boutique,
}: OfferAvatarPropsType) {
  return (
    <NextLink
      data={{
        is_boutique: true,
        ...boutique,
        href: linkUrl,
      }}
      href={linkUrl}
      aria-label={`Go To listing boutique ${name} ${category}`}
      className="offer-avatar hover:z-[999] hover:mb-[15px] hover:h-[50px] hover:w-[50px] hover:ml-[10px] hover:mr-[10px] hover:bottom-[30px] w-[40px] h-[40px] rounded-full cursor-pointer duration-300 bg-white bottom-0 relative flex"
      style={{
        zIndex: zIndex,
        transform: `translateX(-${(zIndex - 1) * 5}px)`,
      }}
    >
      <div className="offer-avatar-info">
        <span>{name}</span>
        <span>{category}</span>
      </div>
      <div className="offer-avatr-inner-s rounded-full  w-full h-full" />
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
