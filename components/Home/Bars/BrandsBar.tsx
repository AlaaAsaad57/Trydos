import StarIcon from "public/svg/starIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { translate } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function BrandsBar(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language").value;
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
