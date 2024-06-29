import React from "react";

function BrandItem({ brand }) {
  return (
    <div className="brand-item">
      <img src={brand.photo} />
    </div>
  );
}

export default BrandItem;
