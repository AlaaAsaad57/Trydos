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
      data-cy="category-Link"
      className={`categories-bar-item  cursor-pointer flex flex-col relative w-auto max-w-full justify-start mx-[5px] items-center ${
        decodeURI(mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      href={
        decodeURI(mainCategory) === slug
          ? `/${params?.lang}`
          : `/${params?.lang}?mainCategory=${slug}`
      }
      data-id={slug}
    >
      {active && (
        <img
          src="/icons/ActiveCategoryIcon.svg"
          className="absolute top-[-6px] left-[-6px]"
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
