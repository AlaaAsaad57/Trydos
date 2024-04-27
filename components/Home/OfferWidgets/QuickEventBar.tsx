import QuickIcon from "public/svg/quickIcon.svg";
import BarDescribtion from "../Bars/BarDescribtion";
import StopWatch from "./StopWatch";
import { translate } from "utils/functions";
import { useSelector } from "react-redux";
function QuickEventBar() {
  const language: string = useSelector((state: any) => state.homepage.language);
  return (
    <div className="quick-event-bar">
      <BarDescribtion
        name={translate("Quick Offer", language)}
        desc={
          translate("This Offer Is For Only", language) +
          " 4 " +
          translate("Hours", language) +
          " , " +
          translate("Remaining", language) +
          " : "
        }
      />
      <StopWatch
        stopHour={new Date().setHours(
          new Date().getHours() + 1,
          new Date().getMinutes() + 2,
          new Date().getSeconds() + 59
        )}
      />
    </div>
  );
}

export default QuickEventBar;
