import Image from "next/image";
interface OfferAvatarProps {
  images: string;
  zIndex: number;
  name: string;
  category: string;
}
function OfferAvatar({ images, zIndex, name, category }: OfferAvatarProps) {
  const getImageCld = () => {
    if (images.includes("cloudinary")) {
      console.log(images.replace("/upload", "/upload/f_webp/q_auto"));
      return images.replace("/upload", "/upload/f_webp/q_auto");
    } else return images;
  };
  return (
    <div
      className="offer-avatar"
      style={{
        zIndex: zIndex,
        transform: `translateX(-${(zIndex - 1) * 5}px)`,
      }}
      onClick={(e) => {
        e.preventDefault();
      }}
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
