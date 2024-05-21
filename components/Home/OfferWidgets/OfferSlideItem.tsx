"use client";
import ImageLoader from "components/global/ImageLoader";
import BorderImage from "./BorderImage";
import { getId } from "utils/functions";
import { useEffect, useRef } from "react";
interface OfferSlideItemProps {
  isSingle: boolean;
  priority: boolean;
  offerPhoto: any;
  mykey: number;
  setSrc: Function;
}
function OfferSlideItem({
  isSingle,
  priority,
  mykey,
  offerPhoto,
  setSrc,
}: OfferSlideItemProps) {
  let id = getId();
  const ref = useRef<HTMLDivElement>();
  useEffect(() => {}, []);
  return (
    <div className="offer-slide-item">
      <div className="image-offer" ref={ref}>
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        {
          <ImageLoader
            loading="eager"
            setSrc={(e) => setSrc(e)}
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
                ?.clientHeight ?? 342
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
