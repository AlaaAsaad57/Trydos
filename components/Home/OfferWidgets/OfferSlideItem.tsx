import ImageLoader from "components/global/ImageLoader";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getId } from "utils/functions";
import { useRef } from "react";
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
  const ref = useRef<HTMLDivElement>();
  return (
    <div className="offer-slide-item">
      <div className="image-offer" ref={ref}>
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        {ref.current && (
          <ImageLoader
            loading="eager"
            id={id}
            priority={false}
            style={{ borderRadius: "15px" }}
            fetchPriority={priority ? "high" : "low"}
            className="OfferImage"
            src={offerPhoto}
            width={ref.current.clientWidth}
            height={ref.current.clientHeight}
            alt="offer"
          />
        )}
        <BorderImage />
      </div>
    </div>
  );
}

export default OfferSlideItem;
