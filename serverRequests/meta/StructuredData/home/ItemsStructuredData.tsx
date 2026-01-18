import React from "react";
import { General_Site_Data } from "../Constants";
import Script from "node_modules/next/script";

function ItemsStructuredData({ local, data, name, schema_name }) {
  let payload = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${General_Site_Data.url}/${local}/#${schema_name}`,
    name: name,
    itemListOrder: "https://schema.org/ItemListOrderUnordered",
    numberOfItems: data?.length,
    itemListElement: data?.map((product) => ({
      "@type": "ListItem",
      position: 1,
      url: `${General_Site_Data.url}/${local}/products/${product?.slug}`,
    })),
  };
  return (
    <Script
      id={`${schema_name}-schema`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default ItemsStructuredData;
