import React from "react";
import { getHomeData } from "store/homepage/cachedActions";
import OfferList from "components/Home/OfferWidgets/OfferList";
import "styles/offers.css";
import Head from "next/head";
async function OfferListServer({ params }) {
  const [HomeData] = await getHomeData({
    str: params?.mainCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  return (
    <>
      <Head>
        <link
          rel="preload"
          href={HomeData[0].banners[0]}
          as="image"
          fetchPriority="high"
        />
      </Head>
      <OfferList boutiques={HomeData.banners} key={2} quick={false} />;
    </>
  );
}

export default OfferListServer;
