import RemoteSvg from "components/global/RemoteSvg";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";
import homeService from "services/home";
import { translate } from "utils/functions";
interface CategoryNavMobileProps {
  name: string;
  icon: string;
  myKey: number;
  slug: string;
}
function CategoryNavMobile({
  name,
  icon,
  myKey,
  slug,
}: CategoryNavMobileProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <div
      className={`categories-bar-item ${
        decodeURI(searchParams.get("category_slug")) === slug &&
        "active-nav-category"
      }`}
      key={myKey}
      onClick={() => {
        router.push(`/categories/${slug}`);
        homeService.GetBoutiques(slug);
      }}
    >
      {
        <div className="categories-bar-item-icon h-[15px]">
          <RemoteSvg url={icon} />
        </div>
      }
      {
        <div className="categories-bar-item-description">
          <div className={`categories-bar-item-name ${language + "-regular"} `}>
            {translate(name, language)}
          </div>
        </div>
      }
    </div>
  );
}

export default CategoryNavMobile;
