import React from "react";
// import OfferImage from "../../../public/images/Kids_BannerInteriorHalloween_2609.WEBP";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getId } from "utils/functions";
function OfferSlideItem({ isSingle }) {
  let id = getId();
  return (
    <div className="offer-slide-item">
      <div className="image-offer">
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        <Image
          loading="eager"
          id={id}
          priority={true}
          className="OfferImage"
          src={
            "https://res.cloudinary.com/djooohujg/image/upload/q_auto/1708506792?_a=DATC1RAAZAA0"
          }
          width={360}
          height={155}
          alt="offer"
        />
        <BorderImage id={id} />
      </div>
    </div>
  );
}

export default OfferSlideItem;
