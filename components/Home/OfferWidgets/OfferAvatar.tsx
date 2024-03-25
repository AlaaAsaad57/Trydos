import Image from "next/image";

function OfferAvatar({ images, zIndex }: { images: string; zIndex: number }) {
  return (
    <div
      className="offer-avatar"
      style={{
        zIndex: zIndex,
        transform: `translateX(-${(zIndex - 1) * 5}px)`,
      }}
    >
      <div className="offer-avatar-info">
        <span>T-shirt</span>
        <span>1100</span>
      </div>
      <div className="offer-avatr-inner-s" />
      <Image
        loading="eager"
        src={images}
        priority={true}
        alt="avatar"
        width={40}
        height={40}
        style={{ borderRadius: "50%", height: "40px" }}
      />
    </div>
  );
}

export default OfferAvatar;
