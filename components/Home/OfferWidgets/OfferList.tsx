"use client";
import NormalWidget from "./NormalWidget";

import { Boutique } from "models/offer";
interface OfferListProps {
  quick: boolean;
  boutiques: Boutique[];
}
function OfferList({ quick, boutiques }: OfferListProps) {
  return (
    <div className={`offers-list ${quick && " mt-5"}`}>
      {/* {quick ? (
        <QuickOfferWidjet onClick={() => {}} offer={{ photos: [1] }} />
      ) : (
        offers.map((offer: number, Index) =>
          Index !== 2 ? (
            <NormalWidget
              onClick={() => {}}
              myKey={Index}
              key={Index}
              offer={{
                photos: Index === 0 || Index === 1 ? [1] : [1, 1],
              }}
            />
          ) : (
            <NormalWidget
              myKey={Index}
              onClick={() => {}}
              key={Index}
              offer={{
                photos: [1, 1, 1].filter((item, index) => index <= Index),
              }}
            />
          )
        )
      )} */}
      {boutiques.map((boutique: Boutique, index) => {
        return (
          <NormalWidget
            onClick={() => {}}
            myKey={index}
            key={boutique.id}
            boutique={boutique}
          />
        );
      })}
    </div>
  );
}

export default OfferList;
