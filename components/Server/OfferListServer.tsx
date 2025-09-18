import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import OfferListSkeleton from "components/skeleton/OfferList";

import { OfferListServerPropsType } from "models/componentType/OfferListServerPropsType";
import DataSourceLogger from "components/global/DataSourceLogger";

async function OfferListServer({
  boutiquesData,
  params,
  dataSourceString,
  children,
}: OfferListServerPropsType) {
  try {
    const [country, language] = params.lang.split("-");
    const HomeData = boutiquesData;

    return (
      <div
        className={`offers-list w-full flex-col items-center justify-start mt-[30px] px-[15px] pb-[184px] gap-[20px]`}
        data-cy="boutiques"
      >
        <DataSourceLogger dataSourceString={dataSourceString} />

        {HomeData?.boutiques?.map((boutique, myKey) => {
          return (
            <>
              <NormalWidget
                boutique={boutique}
                myKey={myKey}
                key={myKey}
                lang={params.lang}
              />
              {myKey === 1 && children}
            </>
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
