import QuickIcon from "public/svg/quickIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import { ReactElement } from "react";
function QuickOffer(): ReactElement {
  const language: string = useSelector((state: any) => state.homepage.language);
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  return (
    <div className={`home-bar ${loginOpen && "hide-offers"}`}>
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
