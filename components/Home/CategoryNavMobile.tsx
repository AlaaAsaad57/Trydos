import RemoteSvg from "components/global/RemoteSvg";
import { dispatchRouteChangeEvent } from "Hooks/events";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";
import { Sendevent, translate } from "utils/functions";
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
  const searchParams: { lang: string; mainCategory: string } = useParams();
  return (
    <div
      className={`categories-bar-item ${
        decodeURI(searchParams.mainCategory) === slug && "active-nav-category"
      }`}
      key={myKey}
      onClick={() => {
        Sendevent({
          event: "button_clicked",
          category: "button_clicked",
          value: `${name} category filter`,
        });
        router.push(`/categories/${slug}`);
        dispatchRouteChangeEvent("start");
      }}
    >
      {
        <div className="categories-bar-item-icon h-[15px]">
          <RemoteSvg size={20} url={icon} isSvg={null} />
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
