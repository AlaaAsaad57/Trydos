import BorderImage from "./BorderImage";
import Image from "next/image";
import { getId } from "utils/functions";
function OfferSlideItem({
  isSingle,
  priority,
}: {
  isSingle: boolean;
  priority: boolean;
}) {
  let id = getId();
  return (
    <div className="offer-slide-item">
      <div className="image-offer">
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        <Image
          loading="eager"
          id={id}
          priority={priority}
          fetchPriority={priority ? "high" : "low"}
          className="OfferImage"
          src={
            "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_auto/1708506792?_a=DATC1RAAZAA0"
          }
          width={360}
          height={155}
          alt="offer"
        />
        <BorderImage />
      </div>
    </div>
  );
}

export default OfferSlideItem;
