import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { dispatchRouteChangeEvent } from "utils/events";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";
import { Sendevent, translate } from "utils/functions";
import NextLink from "components/global/NextLink";

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
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const router = useRouter();
  const searchParams: { lang: string; mainCategory: string } = useParams();

  return (
    <NextLink
      className={`categories-bar-item ${
        decodeURI(searchParams.mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      href={
        decodeURI(searchParams.mainCategory) === slug
          ? "/"
          : `/categories/${slug}`
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
        <ActiveCategoryIcon className="absolute top-[-7px] left-[-13px]" />
      )}
      {
        <div className="categories-bar-item-icon">
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
