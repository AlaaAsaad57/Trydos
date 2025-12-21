import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import OfferListSkeleton from "components/skeleton/OfferList";
import { OfferListServerPropsType } from "models/componentType/OfferListServerPropsType";
import BoutiqueWrapper from "components/ServerWrapper/BoutiqueWrapper";

function OfferListServer({
  boutiquesData,
  params,

  children,
}: OfferListServerPropsType) {
  const HomeData = boutiquesData;
  return (
    <div
      className={`offers-list w-full flex-col items-center max-w-[1280px] justify-start mt-[30px] pb-[184px] gap-[20px]`}
      data-cy="boutiques"
    >
      {HomeData?.boutiques?.map((boutique, myKey) => {
        return (
          <React.Fragment key={myKey}>
            <BoutiqueWrapper lang={params.lang} boutique={boutique} />
            {myKey === 1 && children}
          </React.Fragment>
        );
      })}
      <InfinteScroll offsetVariable={HomeData.searchAfter} />
    </div>
  );
}

export default OfferListServer;
