import StarIcon from "public/svg/starIcon.svg";
import BarDescribtion from "./BarDescribtion";
import Cookies from "js-cookie";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function BrandsBar(): ReactElement {
  const language = Cookies.get("language");
  return (
    <div className={`home-bar`}>
      <StarIcon />
      <BarDescribtion
        name={translate("Brands", language)}
        desc={translate("Best Offers From Brands", language)}
      />
    </div>
  );
}

export default BrandsBar;
