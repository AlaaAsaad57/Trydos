import StarIcon from "public/svg/starIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function BrandsBar(): ReactElement {
  const language: string = useSelector((state: any) => state.homepage.language);

  return (
    <div className="home-bar">
      <StarIcon />
      <BarDescribtion
        name={translate("Brands", language)}
        desc={translate("Best Offers From Brands", language)}
      />
    </div>
  );
}

export default BrandsBar;
