/// <reference types="web-bluetooth" />
"use client";
import { useDispatch } from "react-redux";
import NormalWidget from "./NormalWidget";

import { Boutique } from "models/offer";
import { useEffect, useState } from "react";
import { LogData } from "store/homepage/actions";
import InfinteScroll from "components/global/InfinteScroll";
interface OfferListProps {
  quick: boolean;
  boutiques: Boutique[];
  response?: any;
}
function OfferList({ quick, boutiques, response }: OfferListProps) {
  const BTFunction = async () => {
    try {
      let device = await navigator.bluetooth
        .requestDevice({
          acceptAllDevices: true,
        })
        .then((d) => {
          d.gatt.connect();
        });
    } catch (e) {
      console.log(e);
    }
  };
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
      <button
        className="p-10 w-full rounded-sm bg-slate-600 text-yellow-50"
        onClick={() => BTFunction()}
      >
        Bluetooth
      </button>
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

      <InfinteScroll SetBoutiques={(arr) => SetBoutiquesFunction(arr)} />
    </div>
  );
}

export default OfferList;
