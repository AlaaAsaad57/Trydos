import BarDescribtion from "./BarDescribtion";
import { translateFunction } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function QuickOffer(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;

  return (
    <div className={`home-bar`}>
      <img src={"/svg/quickIcon.svg"} alt="quick offer icon" />
      <BarDescribtion
        name={translateFunction("Quick Offer", language)}
        desc={translateFunction(
          "Products With Great Fast And Limited Offers",
          language
        )}
      />
    </div>
  );
}

export default QuickOffer;
