import OfferIcon from "public/svg/offerIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { translate } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function OfferBar(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;
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
