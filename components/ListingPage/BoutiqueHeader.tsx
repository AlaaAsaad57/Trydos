import React from "react";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import BoutiquePhoto from "./BoutiquePhoto";
import BoutiqueCategoryFilter from "./BoutiqueCategoryFilter";
function BoutiqueHeader() {
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
      <BoutiqueCategoryFilter />
    </div>
  );
}

export default BoutiqueHeader;
