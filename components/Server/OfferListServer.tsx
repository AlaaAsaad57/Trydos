import React from "react";
import { getHomeData } from "store/homepage/cachedActions";
import OfferList from "components/Home/OfferWidgets/OfferList";
import "styles/offers.css";
import "styles/productDetails.css";

async function OfferListServer({ params }) {
  const [HomeData, response] = await getHomeData({
    str: params?.mainCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });

  return (
    <>
      <OfferList
        response={response}
        boutiques={HomeData?.boutiques || []}
        key={2}
        offsetVariable={HomeData?.offset}
        quick={false}
      />
    </>
  );
}

export default OfferListServer;
