import React from "react";
import BorderImage from "./BorderImage";
import Image from "next/image";

function BoutiquePhoto() {
  return (
    <div className="boutique-photo-holder">
      <div className="offer-slider-container">
        <div className="offer-slide-item" style={{ width: "100%" }}>
          <div className="image-offer">
            <div className="image-inner-shadow" style={{ height: "100%" }} />

            <Image
              loading={"eager"}
              fetchPriority={"high"}
              style={{ borderRadius: "15px" }}
              className="OfferImage"
              src={
                "https://res.cloudinary.com/djooohujg/image/upload/q_80/h_342/f_avif/1708506792?_a=DdATC1RAAZAA0"
              }
              width={380}
              unoptimized
              height={135}
              alt="offer"
            />

            <BorderImage />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoutiquePhoto;
