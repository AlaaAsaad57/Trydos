import BarDescribtion from "./BarDescribtion";
import { translateFunction } from "utils/functions";
import { ReactElement } from "react";
import { cookies } from "next/headers";
function OfferBar(): ReactElement {
  let cookiesStore = cookies();
  const language = cookiesStore.get("language")?.value;
  return (
    <div className={`home-bar`}>
      <img src={"/svg/offerIcon.svg"} alt="offer icon" />
      <BarDescribtion
        name={translateFunction("Offer", language)}
        desc={translateFunction("Products With Great Offers", language)}
      />
    </div>
  );
}

export default OfferBar;
