import React from "react";
import "styles/offers.css";
import "styles/productDetails.css";
import InfinteScroll from "components/global/InfinteScroll";
import OfferListSkeleton from "components/skeleton/OfferList";

import { OfferListServerPropsType } from "models/componentType/OfferListServerPropsType";
import DataSourceLogger from "components/global/DataSourceLogger";
import { BoutiqueContainer } from "components/Home/OfferWidgets/BoutiqueElement";

function OfferListServer({
  boutiquesData,
  params,
  dataSourceString,
  children,
}: OfferListServerPropsType) {
  try {
    const HomeData = boutiquesData;

    return (
      <div
        className={`offers-list w-full flex-col items-center max-w-[1280px] justify-start mt-[30px] pb-[184px] gap-[20px]`}
        data-cy="boutiques"
      >
        <DataSourceLogger dataSourceString={dataSourceString} />
        <BoutiqueContainer
          lang={params.lang}
          boutique={{
            name: "Mango",
            description: "10% Discount For All Zara Collection Now!",
            slug: HomeData?.boutiques?.[0]?.slug,
            mainCategoriesForProductIds: [
              {
                most_viewed_product_thumbnail:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760174475/kkubaic7rrj1kvjfij4u.jpg",
                most_viewed_product_name: "Test",
              },
              {
                most_viewed_product_thumbnail:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760174500/gmzesvxjj3i2aluglk6u.jpg",
                most_viewed_product_name: "Test",
              },
              {
                most_viewed_product_thumbnail:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760174552/znlefzdbjk5uovwidon6.jpg",
                most_viewed_product_name: "Test",
              },
              {
                most_viewed_product_thumbnail:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760174585/txjtqpzwvew4uybm4nqy.jpg",
                most_viewed_product_name: "Test",
              },
              {
                most_viewed_product_thumbnail:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760174606/rez6asupqjohjo5yhxqs.jpg",
                most_viewed_product_name: "Test",
              },
            ],
            banners: [
              {
                file_path:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760301649/ak8mzyjf0uunciolot5e.png",
              },
              {
                file_path:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760301649/ak8mzyjf0uunciolot5e.png",
              },
              {
                file_path:
                  "https://res.cloudinary.com/djooohujg/image/upload/v1760301649/ak8mzyjf0uunciolot5e.png",
              },
              // {
              //   file_path:
              //     "https://res.cloudinary.com/djooohujg/image/upload/v1760173134/mbzjjfkwfqspycqobysu.jpg",
              // },
              // {
              //   file_path:
              //     "https://res.cloudinary.com/djooohujg/image/upload/v1760173180/qzzc8sfpd4egzsr2bana.jpg",
              // },
            ],
          }}
        />
        {HomeData?.boutiques?.map((boutique, myKey) => {
          return (
            <React.Fragment key={myKey}>
              {/* <NormalWidget
                boutique={boutique}
                myKey={myKey}
                lang={params.lang}
              /> */}
              <BoutiqueContainer lang={params.lang} boutique={boutique} />
              {myKey === 1 && children}
            </React.Fragment>
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
