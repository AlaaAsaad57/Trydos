import React from "react";

function BoutiqueItem({ boutique }) {
  return (
    <div className="brand-item boutique-item">
      <img src={boutique.banners[0].file_path} />
    </div>
  );
}

export default BoutiqueItem;
