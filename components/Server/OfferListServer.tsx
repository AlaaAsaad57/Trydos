import React from "react";
import { getHomeData } from "store/homepage/cachedActions";

import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import OfferListSkeleton from "components/skeleton/OfferList";

async function OfferListServer({ params }) {
  try {
    const [HomeData, response] = await getHomeData({
      str: params?.mainCategory,
      lang: params.lang ? params.lang.split("-")[1] : null,
      country: params.lang ? params.lang.split("-")[0] : null,
    });

    return (
      <div className={`offers-list pb-[184px]`} data-cy="boutiques">
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
