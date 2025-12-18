import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon";
import Image from "next/image";

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
  outline,
}: CategoryNavMobileProps) {
  // @ts-ignore

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
      className={`categories-bar-item  cursor-pointer flex flex-col relative w-auto max-w-full justify-start mx-[5px] items-center ${
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
        <div
          className="categories-bar-item-icon flex h-auto w-full justify-center"
          data-cy="categoryIcons"
        >
          <Image
            width={25}
            height={25}
            alt={name || "Image"}
            src={getConfiguredImage({
              src: GetImageUrl(active ? outline : icon),
              height: 50,
              width: 50,
            })}
            unoptimized={false}
            className="max-h-[25px] max-w-[25px]"
            priority
            loading="eager"
          />
        </div>
      }
      {
        <div className="categories-bar-item-description flex-row  items-end  justify-start w-auto mt-[4px] h-auto">
          <div
            className={`categories-bar-item-name max-w-[60px] truncate items-center text-[#3c3c3c] text-[10px]  regular  capitalize block`}
          >
            {name}
          </div>
        </div>
      }
    </NextLink>
  );
}

export default CategoryNavMobile;
