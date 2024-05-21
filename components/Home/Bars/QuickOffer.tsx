import QuickIcon from "public/svg/quickIcon.svg";
import BarDescribtion from "./BarDescribtion";
import Cookies from "js-cookie";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function QuickOffer(): ReactElement {
  const language = Cookies.get("language");

  return (
    <div className={`home-bar`}>
      <QuickIcon />
      <BarDescribtion
        name={translate("Quick Offer", language)}
        desc={translate(
          "Products With Great Fast And Limited Offers",
          language
        )}
      />
    </div>
  );
}

export default QuickOffer;
