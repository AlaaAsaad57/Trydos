import React from "react";
import { getHomeData } from "store/homepage/cachedActions";
import OfferList from "components/Home/OfferWidgets/OfferList";
import "styles/offers.css";
async function OfferListServer({ params }) {
  const [HomeData] = await getHomeData({
    str: params?.mainCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  return (
    <>
      <OfferList boutiques={HomeData.banners} key={2} quick={false} />;
    </>
  );
}

export default OfferListServer;
