import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import Image from "next/image";

import React from "react";

import NextLink from "components/global/NextLink";
import { GetImageUrl } from "utils/tinyUtils";
import { CategoryNavMobileProps } from "models/componentType/HomePagePropsType";
import { getConfiguredImage } from "utils/functions";

function CategoryNavMobile({
  name,
  icon,
  myKey,
  slug,
  active,
  params,
}: CategoryNavMobileProps) {
  // @ts-ignore
  let language = params.lang.split("-")[1];

  return (
    <NextLink
      data={{
        is_home: true,
        name,
        icon,
        slug,
        active,
        href:
          decodeURI(params.mainCategory) === slug
            ? `/${params?.lang}`
            : `/${params?.lang}/categories/${slug}`,
      }}
      ariaLabel={`Category ${slug} ${params?.lang}`}
      data-cy="category-Link"
      className={`categories-bar-item ${
        decodeURI(params.mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      href={
        decodeURI(params.mainCategory) === slug
          ? `/${params?.lang}`
          : `/${params?.lang}/categories/${slug}`
      }
    >
      {active && (
        <ActiveCategoryIcon
          className="absolute top-[-7px] left-[-13px]"
          data-cy="activeCategoryIcon"
        />
      )}
      {
        <div className="categories-bar-item-icon" data-cy="categoryIcons">
          <Image
            width={25}
            height={25}
            alt={name || "Image"}
            src={getConfiguredImage({ src: GetImageUrl(icon), height: 50 })}
            priority
            loading="eager"
          />
        </div>
      }
      {
        <div className="categories-bar-item-description">
          <div className={`categories-bar-item-name regular `}>{name}</div>
        </div>
      }
    </NextLink>
  );
}

export default CategoryNavMobile;
