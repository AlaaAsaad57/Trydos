import { dispatchRouteChangeEvent } from "Hooks/events";
import Image from "next/image";
import { useRouter } from "next/navigation";
interface OfferAvatarProps {
  images: string;
  zIndex: number;
  name: string;
  category: string | number;
  linkUrl: string;
  priority: boolean;
}
function OfferAvatar({
  images,
  zIndex,
  name,
  category,
  priority,
  linkUrl,
}: OfferAvatarProps) {
  const router = useRouter();
  const getImageCld = () => {
    if (!images) return "";
    if (images?.includes("cloudinary")) {
      return images.replace("/upload", "/upload/h_100/f_avif/q_100");
    } else return images;
  };
  return (
    <div
      onClick={(e) => {
        window.location.pathname = linkUrl;
        // e.preventDefault();
        // router.push(linkUrl);
        // dispatchRouteChangeEvent("start", { to: "boutique" });
      }}
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
      <div className="offer-avatr-inner-s" />
      <Image
        loading={priority ? "eager" : "lazy"}
        src={getImageCld()}
        priority={priority}
        alt="avatar"
        quality={60}
        width={40}
        height={40}
        unoptimized
        unselectable="on"
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </div>
  );
}

export default OfferAvatar;
