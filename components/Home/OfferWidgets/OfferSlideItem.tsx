import ImageLoader from "components/global/ImageLoader";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getId } from "utils/functions";
interface OfferSlideItemProps {
  isSingle: boolean;
  priority: boolean;
  offerPhoto: any;
}
function OfferSlideItem({
  isSingle,
  priority,
  offerPhoto,
}: OfferSlideItemProps) {
  let id = getId();
  return (
    <div className="offer-slide-item">
      <div className="image-offer">
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        <ImageLoader
          loading="eager"
          id={id}
          priority={false}
          style={{ borderRadius: "15px" }}
          fetchPriority={priority ? "high" : "low"}
          className="OfferImage"
          src={offerPhoto}
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
