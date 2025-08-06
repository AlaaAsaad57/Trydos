import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import OfferListSkeleton from "components/skeleton/OfferList";
import { fetchBoutiques } from "Server Requests";
import { OfferListServerPropsType } from "models/componentType/OfferListServerPropsType";

async function OfferListServer({
  boutiquesData,
  params,
}: OfferListServerPropsType) {
  try {
    const [country, language] = params.lang.split("-");
    const HomeData = boutiquesData;

    return (
      <div className={`offers-list pb-[184px] gap-[10px]`} data-cy="boutiques">
        {HomeData.boutiques.map((boutique, myKey) => {
          return (
            <NormalWidget
              boutique={boutique}
              myKey={myKey}
              key={myKey}
              lang={params.lang}
            />
          );
        })}
        <InfinteScroll
          offsetVariable={HomeData.searchAfter}
          temp={HomeData.temp}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading offers:", error);
    return <OfferListSkeleton />;
  }
}

export default OfferListServer;
