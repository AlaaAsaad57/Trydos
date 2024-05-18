import Link from "next/link";
import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
interface CategoryNavMobileProps {
  name: string;
  icon: ReactElement;
  myKey: number;
}
function CategoryNavMobile({ name, icon, myKey }: CategoryNavMobileProps) {
  const language = useSelector((state: any) => state.homepage.language);

  return (
    <div className="categories-bar-item" key={myKey}>
      {<div className="categories-bar-item-icon">{icon}</div>}
      {
        <div className="categories-bar-item-description">
          <div className={`categories-bar-item-name ${language + "-regular"}`}>
            {translate(name, language)}
          </div>
        </div>
      }
    </div>
  );
}

export default CategoryNavMobile;
