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
function BoutiqueHeader({ boutique }) {
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  useEffect(() => {
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);
  return (
    <div className="boutique-header flex-col align-center">
      <div className="boutique-top-info flex-col items-center">
        <div className="boutique-logo-container flex-row align-center">
          <img width={130} height={20} src={boutique.icon} />
          <VerificationIcon />
          <TopStarIcon />
        </div>
        <div className="boutique-text">{boutique.name}</div>
      </div>
      <BoutiquePhoto photo={boutique.photo} />
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
