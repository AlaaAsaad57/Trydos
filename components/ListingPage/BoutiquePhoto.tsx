import React from "react";
import BorderImage from "./BorderImage";
import Image from "next/image";

function BoutiquePhoto({ photo }) {
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
              src={photo}
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
