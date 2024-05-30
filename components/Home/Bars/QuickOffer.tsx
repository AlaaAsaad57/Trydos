import BarDescribtion from "./BarDescribtion";
import { translate } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function QuickOffer(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;

  return (
    <div className={`home-bar`}>
      <img src={"/svg/quickIcon.svg"} alt="quick offer icon" />
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
