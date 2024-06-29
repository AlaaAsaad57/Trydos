import React from "react";

function CategoryCircle() {
  return (
    <div className="category-circle flex-col align-center">
      <div className="category-shadow" />
      <img
        width={70}
        height={70}
        src="https://s13emagst.akamaized.net/products/53803/53802380/images/res_678a307460a8c283499576d3cdca1304.jpg"
      />
      <div className="category-text-container flex-col align-center">
        <span className="category-title">T-Shirt</span>
        <span className="category-typo">1100</span>
      </div>
    </div>
  );
}

export default CategoryCircle;
