import OfferIcon from "public/svg/offerIcon.svg";
import BarDescribtion from "./BarDescribtion";
import Cookies from "js-cookie";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function OfferBar(): ReactElement {
  const language = Cookies.get("language");
  return (
    <div className={`home-bar`}>
      <OfferIcon />
      <BarDescribtion
        name={translate("Offer", language)}
        desc={translate("Products With Great Offers", language)}
      />
    </div>
  );
}

export default OfferBar;
