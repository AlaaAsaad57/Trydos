import React from "react";
import NormalWidget from "./NormalWidget";
import dynamic from "next/dynamic";
const ExtendedOfferWidget = dynamic(() => import("./ExtendedOfferWidget"), {
  ssr: false,
});
const QuickOfferWidjet = dynamic(() => import("./QuickOfferWidjet"), {
  ssr: false,
});
function OfferList({ offers, quick }) {
  return (
    <div className="offers-list">
      {quick ? (
        <QuickOfferWidjet offer={{ photos: [1] }} />
      ) : (
        offers.map((offer, Index) =>
          Index !== 2 ? (
            <NormalWidget
              myKey={Index}
              key={Index}
              offer={{
                photos: [1, 1, 1].filter((item, index) => index <= Index),
              }}
            />
          ) : (
            <ExtendedOfferWidget
              myKey={Index}
              key={Index}
              offer={{
                photos: [1, 1, 1].filter((item, index) => index <= Index),
              }}
            />
          )
        )
      )}
    </div>
  );
}

export default OfferList;
