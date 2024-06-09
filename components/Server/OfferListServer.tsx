import React from "react";
import { getHomeData } from "store/homepage/cachedActions";
import OfferList from "components/Home/OfferWidgets/OfferList";
import "styles/offers.css";
import OfferListSkeleton from "components/skeleton/OfferList";
async function OfferListServer({ params }) {
  const [HomeData] = await getHomeData({
    str: params?.mainCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  console.log("render offers");
  return (
    <>
      <OfferList boutiques={HomeData} key={2} quick={false} />;
    </>
  );
}

export default OfferListServer;
