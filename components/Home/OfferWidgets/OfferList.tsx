"use client";

import NormalWidget from "./NormalWidget";

import { Boutique } from "models/offer";
import { useEffect, useState } from "react";
import { LogData } from "store/homepage/actions";
import InfinteScroll from "components/global/InfinteScroll";
interface OfferListProps {
  quick: boolean;
  boutiques: Boutique[];
  response?: any;
  offsetVariable?: string;
}
function OfferList({
  quick,
  boutiques,
  response,
  offsetVariable,
}: OfferListProps) {
  useEffect(() => {
    LogData(response);
  }, []);
  const [nextBoutieues, setBoutiques] = useState([]);
  const SetBoutiquesFunction = (arr) => {
    setBoutiques([...nextBoutieues, ...arr]);
  };
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

      {[...boutiques, ...nextBoutieues].map((boutique: Boutique, index) => {
        return (
          <NormalWidget
            onClick={() => {}}
            myKey={index}
            key={boutique.id}
            boutique={boutique}
          />
        );
      })}

      <InfinteScroll
        offsetVariable={offsetVariable}
        SetBoutiques={(arr) => SetBoutiquesFunction(arr)}
      />
    </div>
  );
}

export default OfferList;
