import Image from "next/image";

import NextLink from "components/global/NextLink";
import { GetImageUrl } from "utils/tinyUtils";

import { getConfiguredImage } from "utils/functions";

function CategoryNavMobile({
  name,
  icon,
  myKey,
  slug,
  active,
  params,
  outline,
  mainCategory,
}) {
  // @ts-ignore

  return (
    <NextLink
      data={{
        is_home: true,
      }}
      ariaLabel={`Category ${slug} ${params?.lang}`}
      data-pw="category-Link"
      className={`categories-bar-item  cursor-pointer flex flex-col relative w-auto max-w-full justify-start mx-[5px] items-center ${
        decodeURI(mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      // D-13: the category view lives at /{lang}/categories/{slug}. The old
      // `?mainCategory=` address is NOT redirected (D-14), so building it here
      // sent the shopper to the plain home page and the category was never
      // applied. Tapping the open category still clears the filter.
      href={
        decodeURI(mainCategory) === slug
          ? `/${params?.lang}`
          : `/${params?.lang}/categories/${slug}`
      }
      data-id={slug}
    >
      {active && (
        <img
          src="/icons/ActiveCategoryIcon.svg"
          className="absolute top-[-6px] left-[-6px]"
          data-pw="activeCategoryIcon"
        />
      )}
      {
        <div
          className="categories-bar-item-icon flex h-auto w-full justify-center"
          data-pw="categoryIcons"
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
