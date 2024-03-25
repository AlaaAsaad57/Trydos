import OfferIcon from "public/svg/offerIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
function OfferBar() {
  const language = useSelector((state: any) => state.homepage.language);

  return (
    <div className="home-bar">
      <OfferIcon />
      <BarDescribtion
        name={translate("Offer", language)}
        desc={translate("Products With Great Offers", language)}
      />
    </div>
  );
}

export default OfferBar;
