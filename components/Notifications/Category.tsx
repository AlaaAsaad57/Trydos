import NextLink from "components/global/NextLink";
import React from "react";

function Category({ data }) {
  return (
    <NextLink
      className="flex-col"
      href={`/boutiques/listing?categories=${data.category_slug}`}
      prefetch
    >
      <div className="regular p-2">New Category Added Check it Out</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          <img width={20} height={20} src={data.image} />
        </div>
        <div
          className={`regular flex ml-2 boutique-desc-notification-${data.boutique_slug}`}
        >
          {data.category_name}
        </div>
      </div>
    </NextLink>
  );
}

export default Category;
