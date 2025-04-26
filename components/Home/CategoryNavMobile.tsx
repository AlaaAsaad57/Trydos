import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";

import { Sendevent, translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import { useAppStore } from "store";

interface CategoryNavMobileProps {
  name: string;
  icon: string;
  myKey: number;
  slug: string;
  active: boolean;
  setActive: Function;
}
function CategoryNavMobile({
  name,
  icon,
  myKey,
  slug,
  active,
  setActive,
}: CategoryNavMobileProps) {
  const { language } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const searchParams: { lang: string; mainCategory: string } = useParams();
  useEffect(() => {
    if (active) {
      document.querySelector(".active-nav-category").scrollIntoView({
        behavior: "smooth",
      });
    }
  }, []);
  return (
    <NextLink
      data={{
        is_home: true,
        name,
        icon,
        slug,
        active,
        href:
          decodeURI(searchParams.mainCategory) === slug
            ? `/${lang}`
            : `/${lang}/categories/${slug}`,
      }}
      ariaLabel={`Category ${slug} ${lang}`}
      className={`categories-bar-item ${
        decodeURI(searchParams.mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      href={
        decodeURI(searchParams.mainCategory) === slug
          ? `/${lang}`
          : `/${lang}/categories/${slug}`
      }
      onClick={() => {
        setActive(slug);
        Sendevent({
          event: "button_clicked",
          value: `choose_category_button`,
          extra: {
            category: slug,
          },
        });
      }}
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
            unoptimized
            width={25}
            height={25}
            alt={name}
            src={icon?.replace("/upload", "/upload/h_50/f_webp/q_auto")}
            priority
            loading="eager"
          />
        </div>
      }
      {
        <div className="categories-bar-item-description">
          <div className={`categories-bar-item-name ${language + "-regular"} `}>
            {translate(name, language)}
          </div>
        </div>
      }
    </NextLink>
  );
}

export default CategoryNavMobile;
