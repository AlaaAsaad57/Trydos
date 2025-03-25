import React from "react";
import PricesRow from "./filterComponents/PricesRow";

function BoutiquePriceSelect({ prices }) {
  return (
    <div className="boutique-category-filter flex-row">
      <PricesRow />
    </div>
  );
}

export default BoutiquePriceSelect;
