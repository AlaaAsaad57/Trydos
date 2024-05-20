import ImageLoader from "components/global/ImageLoader";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getId } from "utils/functions";
import { useRef } from "react";
interface OfferSlideItemProps {
  isSingle: boolean;
  priority: boolean;
  offerPhoto: any;
  mykey: number;
}
function OfferSlideItem({
  isSingle,
  priority,
  mykey,
  offerPhoto,
}: OfferSlideItemProps) {
  let id = getId();
  const ref = useRef<HTMLDivElement>();
  return (
    <div className="offer-slide-item">
      <div className="image-offer" ref={ref}>
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        {
          <ImageLoader
            loading="eager"
            id={id}
            priority={mykey < 2}
            style={{ borderRadius: "15px" }}
            fetchPriority={mykey < 2 ? "high" : "low"}
            className="OfferImage"
            src={offerPhoto}
            width={
              document.querySelector<HTMLDivElement>(".offer-slide-item")
                ?.clientWidth ?? 900
            }
            height={
              document.querySelector<HTMLDivElement>(".offer-slide-item")
                ?.clientHeight ?? 350
            }
            alt="offer"
          />
        }
        <BorderImage />
      </div>
    </div>
  );
}

export default OfferSlideItem;
