import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import OfferListSkeleton from "components/skeleton/OfferList";
import { fetchBoutiques } from "Server Requests";

async function OfferListServer({ params }) {
  try {
    const [country, language] = params.lang.split("-");
    const HomeData = await fetchBoutiques(
      language,
      country,
      params.mainCategory || "",
      null,
      10
    );

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
        <InfinteScroll offsetVariable={HomeData.offset} />
      </div>
    );
  } catch (error) {
    console.error("Error loading offers:", error);
    return <OfferListSkeleton />;
  }
}

export default OfferListServer;
