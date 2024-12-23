import React from "react";
import QualityIcon from "public/svg/product/QualityIcon.svg";
import VerifiedIcon from "public/svg/product/Verified.svg";
import Flag from "public/svg/product/flag.svg";
import { translate } from "utils/functions";
function ProductProperties() {
  return (
    <div className="flex-row product-properties w-100">
      <div className="flex-row product-property-row">
        <QualityIcon />
        <span>{translate("Good Quality Product")}</span>
      </div>
      <div className="flex-row product-property-row">
        <VerifiedIcon />
        <span>{translate("Verified by trydos")}</span>
      </div>
      <div className="flex-row product-property-row">
        <Flag />
        <span>{translate("Made In Turkey")}</span>
      </div>
    </div>
  );
}

export default ProductProperties;
