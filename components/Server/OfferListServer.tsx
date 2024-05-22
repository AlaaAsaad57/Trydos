import React, { Suspense } from "react";
import { getHomeData } from "store/homepage/cachedActions";
import OfferList from "components/Home/OfferWidgets/OfferList";
async function OfferListServer({ params, searchParams }) {
  const [HomeData] = await getHomeData({
    str: params?.mainCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });

  return (
    <Suspense>
      <OfferList boutiques={HomeData} key={2} quick={false} />
    </Suspense>
  );
}

export default OfferListServer;
