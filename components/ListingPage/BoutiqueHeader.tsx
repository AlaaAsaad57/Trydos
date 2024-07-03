import React, { useEffect } from "react";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import BoutiquePhoto from "./BoutiquePhoto";
import BoutiqueCategoryFilter from "./BoutiqueCategoryFilter";
import { useSelector } from "react-redux";
import BoutiqueBrandFilter from "./filterComponents/BoutiqueBrandFilter";
import BoutiqueOfferFilter from "./filterComponents/BoutiqueOfferFilter";
import BoutiquePriceFilter from "./filterComponents/BoutiquePriceFilter";
import BoutiqueSizeFilter from "./filterComponents/BoutiqueSizeFilter";
import { expandView, normalizeView } from "utils/functions";
import FilterButtons from "./filterComponents/FilterButtons";
function BoutiqueHeader() {
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  useEffect(() => {
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          console.log(filterEnabled);
          expandView({ filter: false });
        } else {
          normalizeView();
          console.log(filterEnabled);
        }
      }
    });
  }, []);
  return (
    <div className="boutique-header flex-col align-center">
      <div className="boutique-top-info flex-col">
        <div className="boutique-logo-container flex-row align-center">
          <img
            width={130}
            height={20}
            src="https://res.cloudinary.com/dtcmozf4d/image/upload/h_50/f_webp/q_auto/v1/boutiques/boutiques/icon/2024-05-22-664e11545eb62.svg"
          />
          <VerificationIcon />
          <TopStarIcon />
        </div>
        <div className="boutique-text">
          Mango Famous Turkish Brand Best Discounts
        </div>
      </div>
      <BoutiquePhoto />
      <BoutiqueCategoryFilter filterEnabled={filterEnabled} />
      {filterEnabled && (
        <>
          <BoutiqueBrandFilter />
          <BoutiqueOfferFilter />
          <BoutiquePriceFilter />
          <BoutiqueSizeFilter />
          <FilterButtons />
        </>
      )}
    </div>
  );
}

export default BoutiqueHeader;
