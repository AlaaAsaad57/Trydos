import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import OfferListSkeleton from "components/skeleton/OfferList";

async function OfferListServer({ params }) {
  try {
    let newParams = new URLSearchParams();
    if (params.mainCategory) {
      newParams.set("str", params.mainCategory);
    }

    const data = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL +
        `/api/${params.lang}/boutiques?${newParams.toString()}`,
      {
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE),
          tags: ["boutiques"],
        },
      }
    );
    let HomeData = await data.json();

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
